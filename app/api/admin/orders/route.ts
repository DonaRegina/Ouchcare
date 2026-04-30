import { NextResponse } from "next/server";

import { adminOrderCreateSchema, adminOrderUpdateSchema } from "@/lib/api/validation";
import { getAdminContext, loadAdminOrders } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const orders = await loadAdminOrders(context.client);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const payload = adminOrderCreateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid order payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const { error } = await context.client.from("orders").insert({
    user_id: payload.data.userId,
    total: payload.data.totalHuf,
    total_huf: payload.data.totalHuf,
    status: payload.data.status ?? "pending",
    stripe_session_id: payload.data.stripeSessionId ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const payload = adminOrderUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid order payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (payload.data.userId !== undefined) update.user_id = payload.data.userId;
  if (payload.data.totalHuf !== undefined) {
    update.total = payload.data.totalHuf;
    update.total_huf = payload.data.totalHuf;
  }
  if (payload.data.status !== undefined) update.status = payload.data.status;
  if (payload.data.stripeSessionId !== undefined) {
    update.stripe_session_id = payload.data.stripeSessionId;
  }

  const { error } = await context.client.from("orders").update(update).eq("id", payload.data.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const id = String((await request.json().catch(() => null))?.id ?? new URL(request.url).searchParams.get("id") ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  }

  const { error } = await context.client.from("orders").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}