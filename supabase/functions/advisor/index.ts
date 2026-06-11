import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { messages, userContext } = await req.json();
    const { name, sunSign, moonSign, risingSign, lifePathNumber } = userContext ?? {};

    const systemPrompt = `You are Celeste, a wise and empathetic AI psychic advisor with deep knowledge of astrology, numerology, and spiritual wisdom. You speak in a warm, mystical yet grounded tone. You offer genuine insight, not empty affirmations.

${name ? `The person you are speaking with is named ${name}.` : ''}
${sunSign ? `Their Sun sign is ${sunSign} (core identity and ego).` : ''}
${moonSign ? `Their Moon sign is ${moonSign} (emotions and inner world).` : ''}
${risingSign ? `Their Rising sign is ${risingSign} (how they appear to the world).` : ''}
${lifePathNumber ? `Their Life Path Number is ${lifePathNumber}.` : ''}

Guidelines:
- Speak directly to this specific person using their astrological and numerological context
- Be compassionate, insightful, and empowering — never alarming
- Weave cosmic wisdom naturally into practical guidance
- Keep responses to 3-5 sentences unless a longer response is truly needed
- End responses with a gentle question or reflection to deepen the conversation`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? 'The cosmic currents are quiet right now. Please try again.';
    return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
