import Link from "next/link";

import { OrderManager } from "@/components/admin/order-manager";
import { ProductManager } from "@/components/admin/product-manager";
import { VetArticleManager } from "@/components/admin/vet-article-manager";
import { UserManager } from "@/components/admin/user-manager";
import { InventoryPanel } from "@/components/admin/inventory-panel";
import { CustomQueue } from "@/components/admin/custom-queue";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminContext, loadAdminOverview } from "@/lib/supabase/admin";
import { loadVetArticles } from "@/lib/vet/articles";

function StatCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const context = await getAdminContext();

  if ("error" in context) {
    return null;
  }

  const [overview, vetArticles] = await Promise.all([loadAdminOverview(context.client), loadVetArticles(context.client)]);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-10">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-muted/60 px-6 py-8 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.08),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.05),transparent_30%)]" />
        <div className="relative space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Admin dashboard</p>
          <h1 className="text-4xl font-semibold tracking-tight">Operations control for products, orders, and users</h1>
          <p className="max-w-3xl text-muted-foreground">
            Manage the OUCHCare catalog, inventory, custom manufacturing queue, and accounts from a single workspace.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-sm font-medium">
            {[
              { label: "Custom Queue", href: "#custom-queue" },
              { label: "Inventory", href: "#inventory" },
              { label: "Products", href: "#products" },
              { label: "Orders", href: "#orders" },
              { label: "Users", href: "#users" },
              { label: "Vet advice", href: "#vet-advice" },
            ].map((link) => (
              <Link
                key={link.href}
                className="rounded-full border border-[#bff1f5] bg-white px-3 py-2 text-[#166674] shadow-sm transition-colors hover:bg-[#effcfe] dark:border-[#1c7f90] dark:bg-[#0e414a] dark:text-[#96e7ee] dark:hover:bg-[#12525d]"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Active products" value={String(overview.stats.activeProducts)} description={`${overview.stats.totalProducts} total in catalog.`} />
        <StatCard title="Paid orders" value={String(overview.stats.paidOrders)} description={`${overview.stats.totalOrders} total orders.`} />
        <StatCard title="Custom orders" value={String(overview.stats.customOrders)} description="Orders with custom sizing." />
        <StatCard title="Veterinarians" value={String(overview.stats.vetUsers)} description={`${overview.stats.adminUsers} admin accounts.`} />
        <StatCard title="Profiles" value={String(overview.users.length)} description="Total managed accounts." />
      </section>

      <CustomQueue orders={overview.orders} />
      <InventoryPanel variants={overview.variants} />
      <ProductManager products={overview.products} variants={overview.variants} />
      <OrderManager orders={overview.orders} users={overview.users} />
      <UserManager users={overview.users} />
      <VetArticleManager articles={vetArticles} />
    </main>
  );
}
