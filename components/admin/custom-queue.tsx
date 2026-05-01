"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY } from "@/lib/constants/mock-data";
import type { AdminOrder, AdminOrderItem } from "@/lib/types/admin";
import type { OrderStatus } from "@/lib/types/domain";

type CustomQueueProps = {
  orders: AdminOrder[];
};

function hasMeasurements(item: AdminOrderItem) {
  return item.measurements && Object.keys(item.measurements).length > 0;
}

function isCustomItem(item: AdminOrderItem) {
  return item.variantSize === "CUSTOM" || (item.customSize && Object.keys(item.customSize).length > 0);
}

function MeasurementBadges({ measurements }: { measurements: Record<string, unknown> }) {
  const keys = Object.entries(measurements).filter(([, v]) => v != null && v !== "");
  if (keys.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {keys.map(([key, value]) => (
        <span key={key} className="inline-flex items-center gap-1 rounded-full bg-[#effcfe] px-2 py-0.5 text-xs text-[#166674] dark:bg-[#12525d] dark:text-[#96e7ee]">
          <span className="font-medium">{key.replace(/([A-Z])/g, " $1").replace(/cm$/i, "").trim()}:</span>
          <span>{String(value)}</span>
        </span>
      ))}
    </div>
  );
}

export function CustomQueue({ orders }: CustomQueueProps) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter orders that have custom items or are in manufacturing pipeline
  const queueOrders = orders.filter(
    (order) =>
      (order.status === "paid" || order.status === "processing") &&
      order.items.some((item) => isCustomItem(item) || hasMeasurements(item)),
  );

  const processingCount = queueOrders.filter((o) => o.status === "processing").length;
  const paidWaiting = queueOrders.filter((o) => o.status === "paid").length;

  async function updateStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status }),
    });
    setUpdatingId(null);

    if (!response.ok) {
      toast.error("Failed to update order status");
      return;
    }

    toast.success(`Order moved to ${status}`);
    router.refresh();
  }

  return (
    <section className="space-y-6" id="custom-queue">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Paid — awaiting manufacturing</CardDescription>
            <CardTitle className="text-3xl text-[#ff9f2f]">{paidWaiting}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>In production</CardDescription>
            <CardTitle className="text-3xl text-[#239fb1]">{processingCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Order Queue</CardTitle>
          <CardDescription>
            Orders with custom measurements or custom-sized items, ready for the manufacturer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queueOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No custom orders in the pipeline right now.
            </p>
          ) : (
            <div className="space-y-4">
              {queueOrders.map((order) => (
                <div key={order.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.userName}</p>
                      <p className="text-xs text-muted-foreground">{order.userEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Order {order.id.slice(0, 8)} — {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={order.status === "processing" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                      <span className="font-semibold">{CURRENCY.format(order.totalHuf)}</span>
                    </div>
                  </div>

                  {/* Order items with measurements */}
                  <div className="space-y-2">
                    {order.items.filter((item) => isCustomItem(item) || hasMeasurements(item)).map((item) => (
                      <div key={item.id} className="rounded-lg border border-dashed p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.productName} × {item.quantity}</span>
                          <div className="flex items-center gap-2">
                            {item.variantSize && (
                              <Badge variant="outline" className={item.variantSize === "CUSTOM" ? "border-[#ff9f2f] text-[#ff9f2f]" : ""}>
                                {item.variantSize}
                              </Badge>
                            )}
                            <span className="text-muted-foreground">{CURRENCY.format(item.unitPriceHuf)}</span>
                          </div>
                        </div>
                        {hasMeasurements(item) && (
                          <MeasurementBadges measurements={item.measurements} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Status actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {order.status === "paid" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, "processing")}
                        disabled={updatingId === order.id}
                        className="bg-[#239fb1] hover:bg-[#1c7f90]"
                      >
                        Start production
                      </Button>
                    )}
                    {order.status === "processing" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, "shipped")}
                        disabled={updatingId === order.id}
                        className="bg-[#ff9f2f] hover:bg-[#f18d1c]"
                      >
                        Mark shipped
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(order.id, "cancelled")}
                      disabled={updatingId === order.id}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
