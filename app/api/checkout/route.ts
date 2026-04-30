import { NextResponse } from "next/server";

import Stripe from "stripe";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type CheckoutItem = {
  id: string;
  product_id?: string;
  name: string;
  unitPriceHuf: number;
  quantity: number;
  measurement_id?: string;
  custom_size?: Record<string, unknown>;
};

const STRIPE_MIN_HUF = 175;

function getAppUrl(request: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  return new URL(request.url).origin;
}

function getStripeClient() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return new Stripe(stripeSecretKey);
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawPayload = (await request.json().catch(() => null)) as {
      items?: unknown;
    } | null;
    const items = Array.isArray(rawPayload?.items)
      ? (rawPayload.items as CheckoutItem[])
      : [];
    const normalizedItems = items
      .filter(
        (item) =>
          typeof item?.id === "string" &&
          typeof item?.name === "string" &&
          Number.isFinite(item?.unitPriceHuf) &&
          Number.isInteger(item?.quantity) &&
          item.quantity > 0 &&
          item.unitPriceHuf > 0,
      )
      .map((item) => ({
        ...item,
        unitPriceHuf: Math.round(item.unitPriceHuf),
      }));

    const shippingCost =
      typeof (rawPayload as any)?.shipping_cost === "number"
        ? (rawPayload as any).shipping_cost
        : 0;
    const shippingMethod = (rawPayload as any)?.shipping_method ?? null;
    const amountHuf =
      normalizedItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceHuf,
        0,
      ) + shippingCost;

    if (amountHuf <= 0) {
      return NextResponse.json(
        { error: "Checkout amount must be greater than zero." },
        { status: 400 },
      );
    }

    if (amountHuf < STRIPE_MIN_HUF) {
      return NextResponse.json(
        {
          error: `Checkout total (${amountHuf} HUF) must be at least ${STRIPE_MIN_HUF} HUF for Stripe.`,
        },
        { status: 400 },
      );
    }
    const stripe = getStripeClient();
    const baseUrl = getAppUrl(request);

    // Insert order as pending before Stripe session
    const { data: insertedOrder, error: orderInsertError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        total: amountHuf,
        total_huf: amountHuf,
        shipping_cost: shippingCost,
        shipping_method: shippingMethod,
      } as never)
      .select("id")
      .single();

    if (orderInsertError || !insertedOrder) {
      return NextResponse.json(
        { error: "Failed to create order." },
        { status: 500 },
      );
    }

    // Insert order items
    const orderItemsToInsert = normalizedItems.map((item) => ({
      order_id: insertedOrder.id,
      product_id: item.product_id ?? item.id,
      unit_price_huf: item.unitPriceHuf,
      price: item.unitPriceHuf,
      quantity: item.quantity,
    }));
    await supabase.from("order_items").insert(orderItemsToInsert as never);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/checkout/success`,
      cancel_url: `${baseUrl}/checkout`,
      metadata: {
        user_id: user.id,
      },
      line_items: [
        ...normalizedItems.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "huf",
            unit_amount: Math.round(item.unitPriceHuf * 100),
            product_data: {
              name: item.name,
              metadata: {
                product_id: item.product_id ?? item.id,
                ...(item.measurement_id
                  ? { measurement_id: item.measurement_id }
                  : {}),
              },
            },
          },
        })),
        ...(shippingCost > 0
          ? [
              {
                quantity: 1,
                price_data: {
                  currency: "huf",
                  unit_amount: Math.round(shippingCost * 100),
                  product_data: {
                    name: `Shipping: ${shippingMethod ?? "Standard"}`,
                  },
                },
              },
            ]
          : []),
      ],
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    await supabase
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", insertedOrder.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Checkout session creation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
