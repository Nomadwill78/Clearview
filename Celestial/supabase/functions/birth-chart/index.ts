import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { sunSign, moonSign, risingSign, planets } = await req.json();

    const planetLines = Array.isArray(planets) && planets.length
      ? planets.map((p: { planet: string; sign: string }) => `- ${p.planet} in ${p.sign}`).join('\n')
      : '';

    const prompt = `You are a gifted astrologer writing a personalized natal chart interpretation.

Core placements:
- Sun in ${sunSign} (core identity and ego)
- Moon in ${moonSign} (emotions and inner world)
- Rising/Ascendant in ${risingSign} (how they meet the world)
${planetLines ? `\nPlanetary positions:\n${planetLines}` : ''}

Write a warm, mystical yet grounded interpretation that weaves these placements into a cohesive portrait of this soul. Speak directly to the person ("you"). Cover how the Sun, Moon, and Rising interact, and touch on the most striking planetary placements if provided. Be specific and empowering — never generic or alarming. Length: 3 short paragraphs. Do not use markdown headings.`;

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
    const text = data.content?.[0]?.text ?? 'The celestial map is realigning. Please try again in a moment.';
    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
