import Stripe from "stripe";
import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/admin";

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(stripeSecretKey);
}

function getWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
  }

  return webhookSecret;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
    }

    const stripe = getStripeClient();
    const webhookSecret = getWebhookSecret();
    const rawBody = await request.text();

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    const serviceClient = createServiceRoleClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.id) {
        await serviceClient.from("orders").update({ status: "paid" }).eq("stripe_session_id", session.id);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.id) {
        await serviceClient.from("orders").update({ status: "cancelled" }).eq("stripe_session_id", session.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook payload.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
