import { NextResponse } from "next/server";

import { publicProductCreateSchema } from "@/lib/api/validation";
import { getAdminContext } from "@/lib/supabase/admin";
import { loadStorefrontProducts } from "@/lib/storefront/products";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();
  const products = await loadStorefrontProducts(supabase, { slug: slug || undefined, limit: 50 });

  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const adminContext = await getAdminContext();

  if ("error" in adminContext) {
    return NextResponse.json({ error: adminContext.error.message }, { status: adminContext.error.status });
  }

  if (adminContext.role !== "admin" && adminContext.role !== "vet") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = publicProductCreateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid product payload.", issues: payload.error.flatten() }, { status: 400 });
  }

  const { error } = await adminContext.client.from("products").insert({
    slug: payload.data.slug,
    name: payload.data.name,
    description: payload.data.description,
    price_huf: payload.data.basePriceHuf,
    material: payload.data.material,
    hero_image_url: payload.data.heroImageUrl,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
