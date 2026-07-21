import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// A subscription counts as entitled while active OR trialing.
const ENTITLED_STATUSES = ['active', 'trialing'];

export interface Entitlement {
  userId: string | null;
  plan: 'free' | 'starseed' | 'cosmic';
  isPremium: boolean; // starseed or cosmic
  isCosmic: boolean;
}

// Resolves the caller's identity (from their user JWT) and current plan.
// Passing the public anon key as the bearer yields userId=null, so callers can
// require a real authenticated user before doing paid work.
export async function getEntitlement(req: Request): Promise<Entitlement> {
  const authHeader = req.headers.get('Authorization') ?? '';
  let userId: string | null = null;

  if (authHeader && SUPABASE_URL && ANON_KEY) {
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    userId = user?.id ?? null;
  }

  let plan: Entitlement['plan'] = 'free';
  if (userId && SUPABASE_URL && SERVICE_ROLE_KEY) {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: sub } = await admin
      .from('subscriptions')
      .select('plan,status')
      .eq('user_id', userId)
      .in('status', ENTITLED_STATUSES)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub?.plan === 'starseed' || sub?.plan === 'cosmic') plan = sub.plan;
  }

  return { userId, plan, isPremium: plan === 'starseed' || plan === 'cosmic', isCosmic: plan === 'cosmic' };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
