import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Verifies the Stripe-Signature header (t=timestamp,v1=hmac) against the raw
// body. Without this check anyone who discovers the webhook URL could forge a
// checkout.session.completed event and grant themselves a paid plan.
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  let timestamp = '';
  const signatures: string[] = [];
  for (const part of sigHeader.split(',')) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    if (key === 'v1') signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return false;
  // Reject events older than 5 minutes to prevent replay attacks
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return signatures.includes(expected);
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  try {
    if (!STRIPE_WEBHOOK_SECRET) throw new Error('Webhook secret not configured');
    if (!signature || !(await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET))) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan;
      const customerId = session.customer;

      if (userId && plan) {
        await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
        await supabase.from('subscriptions').upsert({
          user_id: userId, plan, status: 'active',
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      await supabase.from('subscriptions').update({ plan: 'free', status: 'canceled', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', sub.id);
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      await supabase.from('subscriptions').update({ status: 'past_due', updated_at: new Date().toISOString() })
        .eq('stripe_subscription_id', invoice.subscription);
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
