import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { sign1, sign2 } = await req.json();

    const prompt = `You are a gifted astrologer analyzing the compatibility between ${sign1} and ${sign2}.

Respond with ONLY a raw JSON object (no markdown, no code fences, no commentary) matching exactly this shape:
{
  "percentage": <integer 0-100 overall compatibility score>,
  "love": "<2-3 sentences on romantic/emotional chemistry>",
  "friendship": "<2-3 sentences on friendship dynamics>",
  "work": "<2-3 sentences on working/collaborating together>",
  "summary": "<2-3 sentence closing reflection on this pairing>"
}

Write in a warm, mystical yet grounded tone. Be specific to ${sign1} and ${sign2} — reference their elements and temperaments. Do not mention that you are an AI.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const raw = data.content?.[0]?.text ?? '';

    // The model is asked for raw JSON; strip any stray code fences just in case,
    // then validate. If it isn't parseable, fail so the client uses its fallback.
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const result = {
      percentage: Math.max(0, Math.min(100, Math.round(Number(parsed.percentage) || 0))),
      love: String(parsed.love ?? ''),
      friendship: String(parsed.friendship ?? ''),
      work: String(parsed.work ?? ''),
      summary: String(parsed.summary ?? ''),
    };

    // The client (generateCompatibility) does JSON.parse on the returned text.
    return new Response(JSON.stringify({ text: JSON.stringify(result) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
