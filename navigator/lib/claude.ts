import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const SONNET = "claude-sonnet-4-6";
export const OPUS   = "claude-opus-4-8";

export interface KpiExtractionResult {
  kpi_id: string;
  raw_value: string;
  numeric_value: number | null;
  confidence: "high" | "medium" | "low";
  period_label: string;
}

export async function extractKpisFromDocument(
  documentText: string,
  kpiDefinitions: { id: string; name: string; description: string; domain: string }[]
): Promise<KpiExtractionResult[]> {
  const kpiList = kpiDefinitions
    .map((k) => `- id:${k.id} | ${k.name} (${k.domain}): ${k.description}`)
    .join("\n");

  const message = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are extracting KPI data from a nonprofit organization document.

Extract values for the following KPIs from the document below. Only include KPIs where you find clear evidence in the text.

KPIs to extract:
${kpiList}

Document:
<document>
${documentText.slice(0, 60000)}
</document>

Respond with a JSON array only (no markdown, no explanation):
[{"kpi_id":"<id>","raw_value":"<exact text from doc>","numeric_value":<number or null>,"confidence":"high|medium|low","period_label":"<fiscal year or period, e.g. FY2024>"}]

If no KPIs can be confidently extracted, respond with an empty array: []`,
      },
    ],
  });

  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    return JSON.parse(text.trim()) as KpiExtractionResult[];
  } catch {
    return [];
  }
}

export async function chatWithConsultant(
  userMessage: string,
  orgContext: {
    orgName: string;
    kpiScores: { name: string; domain: string; score: number }[];
    recentDocuments: string[];
    openActionItems: number;
    completedActionItems: number;
    chatHistory: { role: "user" | "assistant"; content: string }[];
  }
): Promise<{ reply: string; citedSources: { kpi_name?: string; document_name?: string }[]; suggestHandoff: boolean }> {
  const systemPrompt = `You are a virtual nonprofit management consultant for ${orgContext.orgName}, powered by Nomad Consulting's expertise.

Current KPI scores:
${orgContext.kpiScores.map((s) => `- ${s.name} (${s.domain}): ${s.score.toFixed(1)}/5`).join("\n") || "No KPI data available yet."}

Recent documents on file: ${orgContext.recentDocuments.join(", ") || "None"}
Action plan: ${orgContext.openActionItems} open items, ${orgContext.completedActionItems} completed.

Your role:
1. Answer questions grounded in the organization's actual data and KPI scores.
2. Cite specific KPI names or document names when making factual claims.
3. Provide nonprofit best-practice guidance when asked.
4. Be direct and actionable — this is a working consultant, not a chatbot.
5. When a question requires expertise beyond available data, say so honestly and recommend scheduling a Nomad Consulting advisor call.

Tone: Professional, warm, builder-to-builder. No corporate filler.`;

  const history = orgContext.chatHistory.slice(-20);

  const message = await anthropic.messages.create({
    model: OPUS,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      ...history,
      { role: "user", content: userMessage },
    ],
  });

  const reply = message.content[0].type === "text" ? message.content[0].text : "I couldn't process that request.";

  // Detect cited sources from reply text
  const citedSources: { kpi_name?: string }[] = [];
  for (const kpi of orgContext.kpiScores) {
    if (reply.toLowerCase().includes(kpi.name.toLowerCase())) {
      citedSources.push({ kpi_name: kpi.name });
    }
  }

  // Suggest handoff if AI expresses limitations
  const suggestHandoff =
    reply.toLowerCase().includes("nomad consulting") ||
    reply.toLowerCase().includes("advisor") ||
    reply.toLowerCase().includes("beyond what i can") ||
    reply.toLowerCase().includes("recommend speaking");

  return { reply, citedSources, suggestHandoff };
}

export async function generateActionPlan(orgContext: {
  orgName: string;
  kpiScores: { id: string; name: string; domain: string; score: number }[];
}): Promise<{ kpi_id: string; title: string; description: string; assigned_role: "leadership" | "staff"; days_to_complete: number }[]> {
  const urgentKpis = orgContext.kpiScores
    .filter((k) => k.score <= 2.5)
    .sort((a, b) => a.score - b.score)
    .slice(0, 6);

  if (urgentKpis.length === 0) return [];

  const message = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate a prioritized action plan for a nonprofit organization called "${orgContext.orgName}".

The following KPIs need improvement:
${urgentKpis.map((k) => `- id:${k.id} | ${k.name} (${k.domain}): score ${k.score.toFixed(1)}/5`).join("\n")}

For each KPI, create 1-2 concrete, actionable items. Each item should be achievable within 90 days.

Respond with a JSON array only:
[{"kpi_id":"<id>","title":"<short action title>","description":"<2-3 sentence description of what to do and why>","assigned_role":"leadership|staff","days_to_complete":<30|60|90>}]`,
      },
    ],
  });

  try {
    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    return JSON.parse(text.trim());
  } catch {
    return [];
  }
}
