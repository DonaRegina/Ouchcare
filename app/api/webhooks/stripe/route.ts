import { NextResponse } from "next/server";
import Stripe from "stripe";

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

function getLineItemMetadata(lineItem: Stripe.LineItem): Stripe.Metadata {
  const product = lineItem.price?.product;

  if (!product || typeof product === "string" || product.deleted) {
    return {};
  }

  return product.metadata ?? {};
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();
  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid Stripe signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  try {
    const completedSession = event.data.object as Stripe.Checkout.Session;

    const session = await stripe.checkout.sessions.retrieve(
      completedSession.id,
      {
        expand: ["line_items", "line_items.data.price.product"],
      },
    );

    const userId = session.metadata?.user_id?.trim();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing user_id in Stripe session metadata." },
        { status: 400 },
      );
    }

    const serviceClient = createServiceRoleClient();
    const { data: existingOrder, error: existingOrderError } =
      await serviceClient
        .from("orders")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

    if (existingOrderError) {
      return NextResponse.json(
        { error: existingOrderError.message },
        { status: 400 },
      );
    }

    await serviceClient
      .from("orders")
      .update({ status: "paid" })
      .eq("stripe_session_id", session.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
