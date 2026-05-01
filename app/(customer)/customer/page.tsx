import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY } from "@/lib/constants/mock-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard",
  description:
    "Your OUCHCare dashboard with measurements, orders and next steps",
};

export default async function CustomerDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If no user, send to login (layout also protects, but guard here too)
  if (!user) {
    redirect("/auth/login?redirectTo=/customer");
  }

  // Recent orders (last 3)
  const { data: ordersData } = await supabase
    .from("orders")
    .select("id, total_huf, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const orders = (ordersData ?? []) as Array<{
    id: string;
    total_huf: number;
    status: string;
    created_at: string;
  }>;

  const orderIds = orders.map((o) => o.id);
  const { data: orderItemsData } = orderIds.length
    ? await supabase
        .from("order_items")
        .select("order_id, product_id, quantity, unit_price_huf")
        .in("order_id", orderIds)
    : { data: [] };

  const orderItems = (orderItemsData ?? []) as Array<{
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price_huf: number;
  }>;

  const productIds = [
    ...new Set(orderItems.map((it) => it.product_id).filter(Boolean)),
  ];
  const { data: productsData } =
    productIds.length > 0
      ? await supabase.from("products").select("id, name").in("id", productIds)
      : { data: [] };

  const products = (productsData ?? []) as Array<{ id: string; name: string }>;
  const productNameById = new Map(products.map((p) => [p.id, p.name]));

  const itemsByOrder = new Map<
    string,
    Array<{ productName: string; quantity: number; unitPriceHuf: number }>
  >();
  for (const item of orderItems) {
    const cur = itemsByOrder.get(item.order_id) ?? [];
    cur.push({
      productName: productNameById.get(item.product_id) ?? "Product",
      quantity: item.quantity,
      unitPriceHuf: item.unit_price_huf,
    });
    itemsByOrder.set(item.order_id, cur);
  }

  // Measurements: fetch ALL for logged-in user ordered by created_at DESC
  const { data: measurementsData } = await supabase
    .from("measurements")
    .select("id, pet_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const measurements = (measurementsData ?? []) as Array<{
    id: string;
    pet_name: string;
    created_at: string;
  }>;

  // Server action to delete a measurement and refresh by redirecting back to the dashboard
  async function deleteMeasurementAction(formData: FormData) {
    "use server";
    const id = formData.get("id");
    if (!id) return;
    const supabase = await createServerSupabaseClient();
    await supabase.from("measurements").delete().eq("id", id.toString());
    // redirect back to this dashboard to refresh the list
    redirect("/customer");
  }

  function getStatusBadgeClass(status: string) {
    if (status === "paid")
      return "border-green-200 bg-green-100 text-green-800";
    if (status === "pending")
      return "border-yellow-200 bg-yellow-100 text-yellow-900";
    if (status === "shipped")
      return "border-blue-200 bg-blue-100 text-blue-800";
    if (status === "cancelled") return "border-red-200 bg-red-100 text-red-800";
    return "border-slate-200 bg-slate-100 text-slate-800";
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-6xl px-6 py-10">
      <section className="w-full space-y-8">
        <div className="rounded-[2rem] border border-[#bff1f5] bg-gradient-to-br from-white via-[#fff6e7]/70 to-[#effcfe]/70 dark:border-[#1c7f90] dark:from-[#0e414a] dark:via-[#12525d] dark:to-[#0e414a] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
          <Badge className="rounded-full bg-[#239fb1] px-4 py-1 text-white">
            Customer workspace
          </Badge>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-[#239fb1]">
                Protected route
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[#ff9f2f] sm:text-5xl">
                Dashboard
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
                Your dashboard keeps measurements, orders, and store actions
                together after sign in.
              </p>
            </div>
            <div className="rounded-3xl border border-black/5 bg-white/85 p-5 dark:border-white/10 dark:bg-[#12525d] shadow-sm backdrop-blur">
              <p className="text-sm font-medium text-[#239fb1]">
                Recommended next step
              </p>
              <p className="mt-2 text-xl font-semibold text-[#ff9f2f]">
                Measure your pet before checkout
              </p>
              <Button asChild className="mt-4 w-full rounded-xl">
                <Link href="/measurement-wizard">Open measurement wizard</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Orders section */}
          <Card className="flex flex-col border-[#dff8fb] bg-white/90 dark:border-[#1c7f90] dark:bg-[#0e414a]">
            <CardHeader className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-[#ff9f2f]">Recent Orders</CardTitle>
                <p className="text-sm text-slate-600 dark:text-[#96e7ee]/80">Your last purchases</p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/my-orders"
                  className="text-sm text-slate-500 hover:underline"
                >
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-black/10 p-4 dark:border-white/10"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-[#dff8fb]">
                          Order {order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-[#96e7ee]/60">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {order.status}
                        </Badge>
                        <span className="text-sm font-semibold text-slate-900 dark:text-[#dff8fb]">
                          {CURRENCY.format(order.total_huf)}
                        </span>
                      </div>
                    </div>
                    <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-[#96e7ee]/80">
                      {(itemsByOrder.get(order.id) ?? []).map((item) => (
                        <li key={`${order.id}-${item.productName}`}>
                          {item.productName} x {item.quantity} (
                          {CURRENCY.format(item.unitPriceHuf * item.quantity)})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600 dark:text-[#96e7ee]/80">
                  No recent orders. Complete a purchase to see it here.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Measurements section */}
          <Card className="flex flex-col border-[#dff8fb] bg-white/90 dark:border-[#1c7f90] dark:bg-[#0e414a]">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-[#239fb1]">Measurements</CardTitle>
                  <p className="text-sm text-slate-600 dark:text-[#96e7ee]/80">
                    Your saved pet measurements
                  </p>
                </div>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-[#9be8f0] text-slate-700 hover:bg-[#ecfeff] dark:border-[#1c7f90] dark:text-[#dff8fb] dark:hover:bg-[#14515c]"
                >
                  <Link href="/my-measurements">View all</Link>
                </Button>
              </CardHeader>
            <CardContent className="flex-1 space-y-4">
              {measurements.length > 0 ? (
                <div className="grid gap-3">
                  {measurements.map((m) => {
                    const date = new Date(m.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    );
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-black/10 p-4 dark:border-white/10"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-[#dff8fb]">
                            {m.pet_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-[#96e7ee]/60">{date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-[#9be8f0] text-slate-700 hover:bg-[#ecfeff] dark:border-[#1c7f90] dark:text-[#dff8fb] dark:hover:bg-[#14515c]"
                          >
                            <Link href={`/measurement-wizard?edit=${m.id}`}>
                              Edit
                            </Link>
                          </Button>
                          <form action={deleteMeasurementAction}>
                            <input type="hidden" name="id" value={m.id} />
                            <Button variant="destructive" size="sm" type="submit">
                              Delete
                            </Button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-[#96e7ee]/80">
                    You don't have any saved measurements yet.
                  </p>
                  <Button asChild variant="outline" className="flex-1 space-y-4">
                    <Link href="/measurement-wizard">
                      Open measurement wizard
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* quick links */}
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-black/10 bg-white/80 px-5 dark:border-white/10 dark:bg-[#12525d]"
          >
            <Link href="/shop">Browse products</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-black/10 bg-white/80 px-5 dark:border-white/10 dark:bg-[#12525d]"
          >
            <Link href="/measurement-wizard">Measure my pet</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-black/10 bg-white/80 px-5 dark:border-white/10 dark:bg-[#12525d]"
          >
            <Link href="/checkout">Continue checkout</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
