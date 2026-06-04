import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'celestial://';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const PRICE_IDS: Record<string, string> = {
  starseed: Deno.env.get('STRIPE_STARSEED_MONTHLY_PRICE_ID') ?? '',
  cosmic: Deno.env.get('STRIPE_COSMIC_YEARLY_PRICE_ID') ?? '',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');

    const { planId } = await req.json();
    const priceId = PRICE_IDS[planId];
    if (!priceId) throw new Error(`Invalid plan: ${planId}`);

    const { data: profile } = await supabase.from('profiles').select('stripe_customer_id').eq('id', user.id).single();

    const sessionBody: Record<string, any> = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_URL}payment-success`,
      cancel_url: `${APP_URL}payment-cancel`,
      metadata: { user_id: user.id, plan: planId },
    };

    if (profile?.stripe_customer_id) {
      sessionBody.customer = profile.stripe_customer_id;
    } else {
      sessionBody.customer_email = user.email;
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(flattenObject(sessionBody)).toString(),
    });

    const session = await stripeRes.json();
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});

function flattenObject(obj: any, prefix = ''): Record<string, string> {
  return Object.keys(obj).reduce((acc: any, k) => {
    const pre = prefix.length ? `${prefix}[${k}]` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre));
    } else if (Array.isArray(obj[k])) {
      obj[k].forEach((v: any, i: number) => { Object.assign(acc, flattenObject(v, `${pre}[${i}]`)); });
    } else {
      acc[pre] = String(obj[k]);
    }
    return acc;
  }, {});
}
