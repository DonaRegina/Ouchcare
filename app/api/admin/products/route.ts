import { NextResponse } from "next/server";

import { adminProductCreateSchema, adminProductUpdateSchema } from "@/lib/api/validation";
import { getAdminContext, loadAdminProducts } from "@/lib/supabase/admin";

export async function GET() {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const products = await loadAdminProducts(context.client);
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const context = await getAdminContext();

  if ("error" in context) {
    return NextResponse.json({ error: context.error.message }, { status: context.error.status });
  }

  const payload = adminProductCreateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid product payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const { error } = await context.client.from("products").insert({
    slug: payload.data.slug,
    name: payload.data.name,
    description: payload.data.description,
    price_huf: payload.data.basePriceHuf,
    hero_image_url: payload.data.heroImageUrl,
    material: payload.data.material,
    is_active: payload.data.isActive ?? true,
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

  const payload = adminProductUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid product payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (payload.data.slug !== undefined) update.slug = payload.data.slug;
  if (payload.data.name !== undefined) update.name = payload.data.name;
  if (payload.data.description !== undefined) update.description = payload.data.description;
  if (payload.data.basePriceHuf !== undefined) {
    update.price_huf = payload.data.basePriceHuf;
  }
  if (payload.data.heroImageUrl !== undefined) update.hero_image_url = payload.data.heroImageUrl;
  if (payload.data.material !== undefined) update.material = payload.data.material;
  if (payload.data.isActive !== undefined) update.is_active = payload.data.isActive;

  const { error } = await context.client.from("products").update(update).eq("id", payload.data.id);

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
    return NextResponse.json({ error: "Product id is required" }, { status: 400 });
  }

  const { error } = await context.client.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
