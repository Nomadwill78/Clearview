import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Free Ask Celeste questions granted to non-Cosmic accounts.
const FREE_LIMIT = 3;

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { messages, userContext } = await req.json();
    const { name, sunSign, moonSign, risingSign, lifePathNumber } = userContext ?? {};

    // Identify the caller from their JWT so the limit is per-account.
    const authHeader = req.headers.get('Authorization') ?? '';
    let userId: string | null = null;
    if (authHeader && SUPABASE_URL && ANON_KEY) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }

    // Service-role client bypasses RLS to read the plan and write the counter.
    const admin = SUPABASE_URL && SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;

    let isCosmic = false;
    let used = 0;
    if (userId && admin) {
      const { data: sub } = await admin
        .from('subscriptions')
        .select('plan,status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      isCosmic = sub?.plan === 'cosmic';

      if (!isCosmic) {
        const { data: usage } = await admin
          .from('advisor_usage')
          .select('free_questions_used')
          .eq('user_id', userId)
          .maybeSingle();
        used = usage?.free_questions_used ?? 0;
        if (used >= FREE_LIMIT) {
          // Out of free questions — do not spend a model call.
          return json({ limitReached: true, used, remaining: 0 });
        }
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
    if (userId && admin && !isCosmic && generated) {
      newUsed = used + 1;
      await admin
        .from('advisor_usage')
        .upsert({ user_id: userId, free_questions_used: newUsed, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }

    return json({
      text,
      limitReached: false,
      used: isCosmic ? null : newUsed,
      remaining: isCosmic ? null : Math.max(0, FREE_LIMIT - newUsed),
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
