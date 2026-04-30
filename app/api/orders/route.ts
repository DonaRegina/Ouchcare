import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, user_id, total_huf, status, stripe_session_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 400 });
    }

    const orderIds = (orders ?? []).map((order) => order.id);

    const { data: items, error: itemsError } = orderIds.length
      ? await supabase
          .from("order_items")
          .select("order_id, product_id, quantity, unit_price_huf")
          .in("order_id", orderIds)
      : { data: [], error: null };

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    const productIds = [...new Set((items ?? []).map((item) => item.product_id))];
    const { data: products, error: productsError } = productIds.length
      ? await supabase.from("products").select("id, name").in("id", productIds)
      : { data: [], error: null };

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 400 });
    }

    const productNameById = new Map((products ?? []).map((product) => [product.id, product.name]));
    const itemsByOrder = new Map<string, Array<{ productId: string; productName: string; quantity: number; unitPriceHuf: number }>>();

    for (const item of items ?? []) {
      const current = itemsByOrder.get(item.order_id) ?? [];
      current.push({
        productId: item.product_id,
        productName: productNameById.get(item.product_id) ?? "Product",
        quantity: item.quantity,
        unitPriceHuf: item.unit_price_huf ?? 0,
      });
      itemsByOrder.set(item.order_id, current);
    }

    return NextResponse.json({
      orders: (orders ?? []).map((order) => ({
        id: order.id,
        userId: order.user_id,
        totalHuf: order.total_huf,
        status: order.status,
        stripeSessionId: order.stripe_session_id,
        createdAt: order.created_at,
        items: itemsByOrder.get(order.id) ?? [],
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load orders.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
