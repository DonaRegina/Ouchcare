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
      <h1 className="text-3xl font-semibold tracking-tight text-[#0e414a] dark:text-[#96e7ee]">
        Shop post-operative wear
      </h1>
      <p className="max-w-2xl text-[#166674] dark:text-[#96e7ee]/80">
        Choose a standard size or begin with custom measurements for precise
        recovery coverage.
      </p>
      {!products || products.length === 0 ? (
        <p className="rounded-md border border-dashed border-[#bff1f5] p-6 text-sm text-[#1c7f90]">
          No active products found in Supabase. Seed the catalog and mark
          products as active to show them here.
        </p>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {(products ?? []).map((product: any) => {
          const variants = (product.product_variants ?? []) as Array<{
            id: string;
            size: string;
            material: string;
            price_huf: number;
          }>;

          return (
            <Card key={product.id} className="h-full overflow-hidden border-[#bff1f5] bg-white shadow-sm dark:border-[#1c7f90] dark:bg-[#0e414a]">
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
                <CardTitle className="text-[#0e414a] dark:text-[#dff8fb]">{product.name}</CardTitle>
                <CardDescription className="line-clamp-3 text-[#1c7f90] dark:text-[#96e7ee]/70">
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
