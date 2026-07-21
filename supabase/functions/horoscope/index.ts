import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { getEntitlement, corsHeaders, jsonResponse } from '../_shared/entitlement.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { sign, period, category } = await req.json();

    // Require an authenticated user; the "general" reading is free, but the
    // specialized categories are a premium (Starseed/Cosmic) feature.
    const { userId, isPremium } = await getEntitlement(req);
    if (!userId) return jsonResponse({ error: 'Authentication required' }, 401);
    if (category !== 'general' && !isPremium) return jsonResponse({ error: 'Premium required' }, 403);

    const dateContext = period === 'yesterday' ? 'yesterday' : period === 'tomorrow' ? 'tomorrow' : 'today';
    const prompt = `You are a gifted astrologer writing a ${category} horoscope for ${sign} for ${dateContext}. Write in a warm, mystical, empathetic tone. Be specific and actionable. Length: 3-4 sentences. Do not include the sign name or date in your response.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? 'The stars are aligning. Please try again.';
    return jsonResponse({ text });
  } catch (_err) {
    return jsonResponse({ error: 'Unable to generate horoscope' }, 500);
  }
});
