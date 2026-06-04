import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  // Note: In production, verify the webhook signature using Stripe's library
  try {
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
