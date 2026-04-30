import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CURRENCY } from "@/lib/constants/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProductCard from "@/components/store/product-card";

export default async function ShopPage() {
  const supabase = await createServerSupabaseClient();
  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, description, price_huf, hero_image_url, is_active, product_variants(id, size, material, price_huf)",
    )
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Shop post-operative wear
      </h1>
      <p className="text-muted-foreground max-w-2xl">
        Choose a standard size or begin with custom measurements for precise
        recovery coverage.
      </p>
      {!products || products.length === 0 ? (
        <p className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
          No active products found in Supabase. Seed the catalog and mark
          products as active to show them here.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(products ?? []).map((product: any) => {
          const variants = (product.product_variants ?? []) as Array<{
            id: string;
            size: string;
            material: string;
            price_huf: number;
          }>;

          return (
            <Card key={product.id} className="h-full overflow-hidden">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={product.hero_image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <ProductCard
                  product={{
                    id: product.id,
                    name: product.name,
                    variants,
                  }}
                />
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
