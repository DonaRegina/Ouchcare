import { ProductManager } from "@/components/admin/product-manager";
import { getAdminContext, loadAdminOverview } from "@/lib/supabase/admin";

export default async function AdminProductsPage() {
  const context = await getAdminContext();

  if ("error" in context) {
    return null;
  }

  const overview = await loadAdminOverview(context.client);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <ProductManager products={overview.products} />
    </main>
  );
}
