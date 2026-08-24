import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { embeddedOne, type EmbeddedKpi } from "@/lib/supabase/embedded";
import { chatWithConsultant } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orgId, message } = await req.json() as { orgId: string; message: string };
  if (!orgId || !message?.trim()) {
    return NextResponse.json({ error: "Missing orgId or message" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify membership — leadership and admin can chat
  const { data: member } = await supabase
    .from("org_members")
    .select("role")
    .eq("clerk_user_id", userId)
    .eq("org_id", orgId)
    .single();

  if (!member || !["admin", "leadership"].includes(member.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch org context
  const [{ data: org }, { data: scores }, { data: docs }, { data: history }] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", orgId).single(),
    supabase.from("kpi_scores").select("score, kpi_definitions(name, domain)").eq("org_id", orgId).order("computed_at", { ascending: false }).limit(30),
    supabase.from("documents").select("file_name").eq("org_id", orgId).eq("processing_status", "complete").order("created_at", { ascending: false }).limit(5),
    supabase.from("chat_messages").select("role, content").eq("org_id", orgId).order("created_at", { ascending: true }).limit(20),
  ]);

  const { data: openItems } = await supabase.from("action_items").select("id", { count: "exact" }).eq("org_id", orgId).eq("status", "open");
  const { data: doneItems } = await supabase.from("action_items").select("id", { count: "exact" }).eq("org_id", orgId).eq("status", "complete");

  // Promise.all over heterogeneous query builders erases the row type, so the
  // shape selected above is restated here.
  type ScoreRow = { score: number; kpi_definitions: unknown };

  const kpiScores = ((scores ?? []) as ScoreRow[]).map((s) => {
    const kpi = embeddedOne<EmbeddedKpi>(s.kpi_definitions);
    return {
      name: kpi?.name ?? "",
      domain: kpi?.domain ?? "",
      score: s.score,
    };
  });

  const { reply, citedSources, suggestHandoff } = await chatWithConsultant(message, {
    orgName: org?.name ?? "Your Organization",
    kpiScores,
    recentDocuments: ((docs ?? []) as { file_name: string }[]).map((d) => d.file_name),
    openActionItems: openItems?.length ?? 0,
    completedActionItems: doneItems?.length ?? 0,
    chatHistory: (history ?? []) as { role: "user" | "assistant"; content: string }[],
  });

  // Persist both messages
  await supabase.from("chat_messages").insert([
    { org_id: orgId, role: "user", content: message },
    { org_id: orgId, role: "assistant", content: reply, cited_sources: citedSources },
  ]);

  return NextResponse.json({ reply, cited_sources: citedSources, suggestHandoff });
}
