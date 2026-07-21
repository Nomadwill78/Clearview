import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getEntitlement, corsHeaders, jsonResponse } from '../_shared/entitlement.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Free Ask Celeste questions granted to non-Cosmic accounts.
const FREE_LIMIT = 3;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { messages, userContext } = await req.json();
    const { name, sunSign, moonSign, risingSign, lifePathNumber } = userContext ?? {};

    // Require a real authenticated user. The public anon key resolves to no
    // user, so this closes the "drop the JWT for unlimited/uncounted answers"
    // bypass.
    const { userId, isCosmic } = await getEntitlement(req);
    if (!userId) return jsonResponse({ error: 'Authentication required' }, 401);

    // Service-role client bypasses RLS to read/write the free-question counter.
    const admin = SUPABASE_URL && SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;

    let used = 0;
    if (!isCosmic && admin) {
      const { data: usage } = await admin
        .from('advisor_usage')
        .select('free_questions_used')
        .eq('user_id', userId)
        .maybeSingle();
      used = usage?.free_questions_used ?? 0;
      if (used >= FREE_LIMIT) {
        // Out of free questions — do not spend a model call.
        return jsonResponse({ limitReached: true, used, remaining: 0 });
      }
    }

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
    const generated = data.content?.[0]?.text;
    const text = generated ?? 'The cosmic currents are quiet right now. Please try again.';

    // Count this question against the free allowance (non-Cosmic users only),
    // but only when we actually produced a reading — never charge for a failure.
    let newUsed = used;
    if (!isCosmic && admin && generated) {
      newUsed = used + 1;
      await admin
        .from('advisor_usage')
        .upsert({ user_id: userId, free_questions_used: newUsed, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }

    return jsonResponse({
      text,
      limitReached: false,
      used: isCosmic ? null : newUsed,
      remaining: isCosmic ? null : Math.max(0, FREE_LIMIT - newUsed),
    });
  } catch (_err) {
    return jsonResponse({ error: 'Unable to reach Celeste' }, 500);
  }
});
