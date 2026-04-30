"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DataTable } from "@/components/admin/data-table";
import { createOrderColumns } from "@/components/admin/columns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminOrder, AdminUser, OrderFormValues } from "@/lib/types/admin";
import type { OrderStatus } from "@/lib/types/domain";

const orderStatuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "cancelled"];

const emptyForm: OrderFormValues = {
  userId: "",
  totalCents: 0,
  status: "pending",
  stripeSessionId: "",
};

type OrderManagerProps = {
  orders: AdminOrder[];
  users: AdminUser[];
};

export function OrderManager({ orders, users }: OrderManagerProps) {
  const router = useRouter();
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
  const [form, setForm] = useState<OrderFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingOrder) {
      setForm({
        userId: editingOrder.userId,
        totalCents: editingOrder.totalHuf,
        status: editingOrder.status,
        stripeSessionId: editingOrder.stripeSessionId ?? "",
      });
      return;
    }

    setForm(emptyForm);
  }, [editingOrder]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/admin/orders", {
      method: editingOrder ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(editingOrder ? { id: editingOrder.id } : {}),
        ...form,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to save order");
      return;
    }

    toast.success(editingOrder ? "Order updated" : "Order created");
    setEditingOrder(null);
    setForm(emptyForm);
    router.refresh();
  }

  async function deleteOrder(order: AdminOrder) {
    const response = await fetch("/api/admin/orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to delete order");
      return;
    }

    if (editingOrder?.id === order.id) {
      setEditingOrder(null);
      setForm(emptyForm);
    }

    toast.success("Order deleted");
    router.refresh();
  }

  const columns = createOrderColumns({
    onEdit: setEditingOrder,
    onDelete: deleteOrder,
  });

  return (
    <section className="space-y-6" id="orders">
      <Card>
        <CardHeader>
          <CardTitle>{editingOrder ? "Edit order" : "Create order"}</CardTitle>
          <CardDescription>
            Adjust lifecycle, total, or manual records for a customer order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="order-user">Customer</Label>
              <select
                id="order-user"
                value={form.userId}
                onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                required
              >
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-total">Total (HUF x100)</Label>
              <Input
                id="order-total"
                type="number"
                min="0"
                value={form.totalCents}
                onChange={(event) =>
                  setForm((current) => ({ ...current, totalCents: Number(event.target.value) || 0 }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="order-status">Status</Label>
              <select
                id="order-status"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as OrderStatus }))}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="order-session">Stripe session id</Label>
              <Input
                id="order-session"
                value={form.stripeSessionId}
                onChange={(event) => setForm((current) => ({ ...current, stripeSessionId: event.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingOrder ? "Update order" : "Create order"}
              </Button>
              {editingOrder ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingOrder(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Orders table</CardTitle>
          <CardDescription>Inspect order records, update fulfillment status, or remove test entries.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <DataTable columns={columns} data={orders} searchPlaceholder="Search orders..." />
        </CardContent>
      </Card>
    </section>
  );
}
