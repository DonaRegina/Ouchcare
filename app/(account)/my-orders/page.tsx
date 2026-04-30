import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Orders",
  description: "View your OUCHCare orders and purchased items",
};

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  total_huf: number;
  order_items: Array<{
    quantity: number;
    unit_price_huf: number;
    products: { name: string } | Array<{ name: string }> | null;
  }> | null;
};

function formatHuf(value: number) {
  return `${value.toLocaleString("hu-HU")} Ft`;
}

function getStatusBadgeClass(status: string) {
  if (status === "paid") {
    return "border-green-200 bg-green-100 text-green-800";
  }

  if (status === "pending") {
    return "border-yellow-200 bg-yellow-100 text-yellow-900";
  }

  if (status === "shipped") {
    return "border-blue-200 bg-blue-100 text-blue-800";
  }

  if (status === "cancelled") {
    return "border-red-200 bg-red-100 text-red-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-800";
}

function getProductName(item: NonNullable<OrderRow["order_items"]>[number]) {
  if (!item.products) {
    return "Product";
  }

  if (Array.isArray(item.products)) {
    return item.products[0]?.name ?? "Product";
  }

  return item.products.name;
}

export default async function MyOrdersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, status, total_huf, order_items(quantity, unit_price_huf, products(name))",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load orders: ${error.message}`);
  }

  const orders = (data ?? []) as OrderRow[];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground">
          Track your recent purchases and order status.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                You do not have any orders yet.
              </p>
              <Button asChild>
                <Link href="/shop">Go to Shop</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const createdAt = new Date(order.created_at).toLocaleDateString(
              "hu-HU",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            );
            const items = order.order_items ?? [];

            return (
              <Card key={order.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      Order on {createdAt}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Order ID: {order.id}
                    </p>
                  </div>
                  <Badge className={getStatusBadgeClass(order.status)}>
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span>
                          {getProductName(item)} x {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatHuf(item.unit_price_huf)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t pt-3">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-semibold">
                      {formatHuf(order.total_huf)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
