import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";
import type { Product, ProductSize } from "@/lib/types/domain";


type LoadProductsOptions = {
  slug?: string;
  limit?: number;
};

const VALID_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "CUSTOM"];

function normalizeSize(value: string): ProductSize | null {
  return VALID_SIZES.includes(value as ProductSize) ? (value as ProductSize) : null;
}

function sortSizes(a: ProductSize, b: ProductSize) {
  return VALID_SIZES.indexOf(a) - VALID_SIZES.indexOf(b);
}

export async function loadStorefrontProducts(client: SupabaseClient<Database>, options: LoadProductsOptions = {}): Promise<Product[]> {
  let query = client
    .from("products")
    .select("id, slug, name, description, price_huf, hero_image_url, material, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })


  if (options.slug) {
    query = query.eq("slug", options.slug);
  }

  const { data: productRows, error: productsError } = await query;

  if (productsError || !productRows || productRows.length === 0) {
    return [];
  }

  const productIds = productRows.map((row) => row.id);

  const { data: variantRows } = await client
    .from("product_variants")
    .select("product_id, size")
    .in("product_id", productIds);

  const sizesByProduct = new Map<string, ProductSize[]>();

  for (const variant of variantRows ?? []) {
    const normalized = normalizeSize(variant.size);

    if (!normalized) {
      continue;
    }

    const current = sizesByProduct.get(variant.product_id) ?? [];

    if (!current.includes(normalized)) {
      current.push(normalized);
      current.sort(sortSizes);
      sizesByProduct.set(variant.product_id, current);
    }
  }

  return productRows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    basePriceHuf: row.price_huf,
    heroImageUrl: row.hero_image_url,
    material: row.material,
    availableSizes: sizesByProduct.get(row.id) ?? ["CUSTOM"],
    isActive: row.is_active,
  }));
}
