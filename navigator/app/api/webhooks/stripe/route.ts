import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status;
      const priceId = sub.items.data[0]?.price.id;

      const tierMap: Record<string, string> = {
        [process.env.STRIPE_STARTER_PRICE_ID!]:      "starter",
        [process.env.STRIPE_PROFESSIONAL_PRICE_ID!]: "professional",
        [process.env.STRIPE_ENTERPRISE_PRICE_ID!]:   "enterprise",
      };
      const tier = tierMap[priceId] ?? "starter";

      await supabase
        .from("organizations")
        .update({
          subscription_status: status === "active" ? "active" : status === "past_due" ? "past_due" : "cancelled",
          subscription_tier: tier,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase
        .from("organizations")
        .update({ subscription_status: "cancelled" })
        .eq("stripe_customer_id", sub.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
