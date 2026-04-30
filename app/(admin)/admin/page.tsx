import Link from "next/link";

import { OrderManager } from "@/components/admin/order-manager";
import { ProductManager } from "@/components/admin/product-manager";
import { VetArticleManager } from "@/components/admin/vet-article-manager";
import { UserManager } from "@/components/admin/user-manager";
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
      <CardContent className="pb-6 text-sm text-muted-foreground">{description}</CardContent>
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
            Manage the OUCHCare catalog and accounts from a single Supabase-backed workspace. Role checks stay tied to the
            profiles table, so vet and admin permissions remain visible in the same place you edit them.
          </p>
          <div className="flex flex-wrap gap-3 pt-2 text-sm font-medium">
            <Link className="rounded-full border border-[#bff1f5] bg-white px-3 py-2 text-[#166674] shadow-sm transition-colors hover:bg-[#effcfe] dark:border-[#166674] dark:bg-slate-950 dark:text-[#96e7ee] dark:hover:bg-[#0e414a]/40" href="#products">
              Products
            </Link>
            <Link className="rounded-full border border-[#bff1f5] bg-white px-3 py-2 text-[#166674] shadow-sm transition-colors hover:bg-[#effcfe] dark:border-[#166674] dark:bg-slate-950 dark:text-[#96e7ee] dark:hover:bg-[#0e414a]/40" href="#orders">
              Orders
            </Link>
            <Link className="rounded-full border border-[#bff1f5] bg-white px-3 py-2 text-[#166674] shadow-sm transition-colors hover:bg-[#effcfe] dark:border-[#166674] dark:bg-slate-950 dark:text-[#96e7ee] dark:hover:bg-[#0e414a]/40" href="#users">
              Users
            </Link>
            <Link className="rounded-full border border-[#bff1f5] bg-white px-3 py-2 text-[#166674] shadow-sm transition-colors hover:bg-[#effcfe] dark:border-[#166674] dark:bg-slate-950 dark:text-[#96e7ee] dark:hover:bg-[#0e414a]/40" href="#vet-advice">
              Vet advice
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active products"
          value={String(overview.stats.activeProducts)}
          description={`${overview.stats.totalProducts} total product records in Supabase.`}
        />
        <StatCard
          title="Paid orders"
          value={String(overview.stats.paidOrders)}
          description={`${overview.stats.totalOrders} total order records tracked in the dashboard.`}
        />
        <StatCard
          title="Veterinarians"
          value={String(overview.stats.vetUsers)}
          description={`${overview.stats.adminUsers} admins are also available for full access.`}
        />
        <StatCard
          title="Profiles"
          value={String(overview.users.length)}
          description="Every role-managed account is stored in the profiles table and editable here."
        />
      </section>

      <ProductManager products={overview.products} />
      <OrderManager orders={overview.orders} users={overview.users} />
      <UserManager users={overview.users} />
      <VetArticleManager articles={vetArticles} />
    </main>
  );
}
