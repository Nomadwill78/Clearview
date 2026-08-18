import { inngest } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import { embeddedOne, type EmbeddedKpi } from "@/lib/supabase/embedded";

/** A KPI definition as selected by the extraction job. */
type KpiDefinition = {
  id: string;
  name: string;
  description: string;
  domain: string;
};
import { extractKpisFromDocument, generateActionPlan } from "@/lib/claude";

export const extractKpisJob = inngest.createFunction(
  { id: "extract-kpis", retries: 3 },
  { event: "document/uploaded" },
  async ({ event, step }) => {
    const { documentId, orgId } = event.data as { documentId: string; orgId: string };
    const supabase = createServiceClient();

    // Mark as processing
    await step.run("mark-processing", async () => {
      await supabase
        .from("documents")
        .update({ processing_status: "processing" })
        .eq("id", documentId);
    });

    // Fetch document metadata
    const doc = await step.run("fetch-document", async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("storage_path, file_name, category")
        .eq("id", documentId)
        .single();
      if (error) throw new Error(`Document not found: ${error.message}`);
      return data;
    });

    // Download and convert to text in a single step. Inngest serialises step
    // return values to JSON, so the binary must never cross a step boundary —
    // only the extracted text does.
    const documentText = await step.run("extract-text", async () => {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.storage_path);
      if (error) throw new Error(`Storage download failed: ${error.message}`);

      const ext = doc.file_name.split(".").pop()?.toLowerCase() ?? "";
      const buffer = Buffer.from(await data.arrayBuffer());

      if (ext === "pdf") {
        const pdfParse = (await import("pdf-parse")).default;
        const result = await pdfParse(buffer);
        return result.text;
      }

      if (["xlsx", "xls"].includes(ext)) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        return workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          return `Sheet: ${name}\n${XLSX.utils.sheet_to_csv(sheet)}`;
        }).join("\n\n");
      }

      if (["docx", "doc"].includes(ext)) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      }

      if (ext === "csv") {
        return buffer.toString("utf-8");
      }

      throw new Error(`Unsupported file type: ${ext}`);
    });

    // Fetch KPI definitions for this org (standard + custom)
    const kpiDefs = await step.run("fetch-kpi-definitions", async (): Promise<KpiDefinition[]> => {
      const { data } = await supabase
        .from("kpi_definitions")
        .select("id, name, description, domain")
        .or(`org_id.eq.${orgId},org_id.is.null`)
        .eq("is_active", true);
      return (data ?? []) as KpiDefinition[];
    });

    // Extract KPI values using Claude
    const extracted = await step.run("extract-kpi-values", async () => {
      return extractKpisFromDocument(documentText, kpiDefs);
    });

    // Persist extracted values
    await step.run("save-kpi-values", async () => {
      if (extracted.length === 0) return;
      await supabase.from("kpi_values").insert(
        extracted.map((e) => ({
          org_id: orgId,
          kpi_id: e.kpi_id,
          document_id: documentId,
          raw_value: e.raw_value,
          numeric_value: e.numeric_value,
          confidence: e.confidence,
          period_label: e.period_label,
        }))
      );
    });

    // Recompute KPI scores
    await step.run("recompute-scores", async () => {
      const affectedKpiIds = [...new Set(extracted.map((e) => e.kpi_id))];
      for (const kpiId of affectedKpiIds) {
        const { data: values } = await supabase
          .from("kpi_values")
          .select("numeric_value, manually_overridden")
          .eq("org_id", orgId)
          .eq("kpi_id", kpiId)
          .not("numeric_value", "is", null);

        if (!values || values.length === 0) continue;

        const kpiDef = kpiDefs.find((k) => k.id === kpiId);
        if (!kpiDef) continue;

        // Simple scoring: map to 1-5 based on latest value
        // A proper implementation would use scoring_logic from kpi_definitions
        const latest = values[values.length - 1].numeric_value as number;
        const score = Math.min(5, Math.max(1, Math.round(latest * 5)));

        await supabase.from("kpi_scores").upsert({
          org_id: orgId,
          kpi_id: kpiId,
          score,
          period_label: extracted.find((e) => e.kpi_id === kpiId)?.period_label ?? "",
          computed_at: new Date().toISOString(),
        });
      }
    });

    // Mark document complete
    await step.run("mark-complete", async () => {
      await supabase
        .from("documents")
        .update({ processing_status: "complete" })
        .eq("id", documentId);
    });

    // Generate/refresh action plan after scoring
    await step.run("refresh-action-plan", async () => {
      const { data: scores } = await supabase
        .from("kpi_scores")
        .select("kpi_id, score, kpi_definitions(id, name, domain)")
        .eq("org_id", orgId)
        .order("computed_at", { ascending: false });

      if (!scores || scores.length === 0) return;

      const scoreRows = scores as { kpi_id: string; score: number; kpi_definitions: unknown }[];

      const kpiScores = scoreRows.flatMap((s) => {
        const kpi = embeddedOne<Required<EmbeddedKpi>>(s.kpi_definitions);
        // Skip scores whose KPI definition was removed rather than emitting a
        // half-populated entry into the action plan prompt.
        if (!kpi) return [];
        return [{ id: kpi.id, name: kpi.name, domain: kpi.domain, score: s.score }];
      });

      if (kpiScores.length === 0) return;

      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single();

      const plan = await generateActionPlan({ orgName: org?.name ?? "Your Organization", kpiScores });

      if (plan.length === 0) return;

      // Insert new items (avoid duplicates by checking title)
      const { data: existing } = await supabase
        .from("action_items")
        .select("title")
        .eq("org_id", orgId);

      const existingTitles = new Set(
        ((existing ?? []) as { title: string }[]).map((i) => i.title),
      );

      const newItems = plan
        .filter((p) => !existingTitles.has(p.title))
        .map((p) => ({
          org_id: orgId,
          kpi_id: p.kpi_id || null,
          title: p.title,
          description: p.description,
          assigned_role: p.assigned_role,
          suggested_due_date: new Date(Date.now() + p.days_to_complete * 86400000).toISOString().split("T")[0],
          status: "open",
          created_by: "ai",
        }));

      if (newItems.length > 0) {
        await supabase.from("action_items").insert(newItems);
      }
    });

    return { documentId, extracted: extracted.length };
  }
);
