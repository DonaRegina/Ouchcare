"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CURRENCY } from "@/lib/constants/mock-data";
import type { AdminProductVariant } from "@/lib/types/admin";

type InventoryPanelProps = {
  variants: AdminProductVariant[];
};

export function InventoryPanel({ variants }: InventoryPanelProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState(0);
  const [saving, setSaving] = useState(false);

  // Group by product
  const grouped = variants.reduce<Record<string, { productName: string; variants: AdminProductVariant[] }>>(
    (acc, v) => {
      if (!acc[v.productId]) {
        acc[v.productId] = { productName: v.productName, variants: [] };
      }
      acc[v.productId].variants.push(v);
      return acc;
    },
    {},
  );

  async function updateStock(variantId: string) {
    setSaving(true);
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, stock: stockValue }),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error("Failed to update stock");
      return;
    }

    toast.success("Stock updated");
    setEditingId(null);
    router.refresh();
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
  const lowStock = variants.filter((v) => v.stock > 0 && v.stock <= 5);
  const outOfStock = variants.filter((v) => v.stock === 0);

  return (
    <section className="space-y-6" id="inventory">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total units in stock</CardDescription>
            <CardTitle className="text-3xl">{totalStock}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Low stock variants (≤5)</CardDescription>
            <CardTitle className="text-3xl text-[#ff9f2f]">{lowStock.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Out of stock</CardDescription>
            <CardTitle className="text-3xl text-destructive">{outOfStock.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>Stock levels per product variant. Click a stock number to edit it.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(grouped).map(([productId, group]) => (
              <div key={productId} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.productName}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.variants.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <Badge variant="outline" className="mb-1">{v.size}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {v.additionalPriceCents !== 0
                            ? `${v.additionalPriceCents > 0 ? "+" : ""}${CURRENCY.format(v.additionalPriceCents)}`
                            : "Base price"}
                        </p>
                      </div>
                      {editingId === v.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={stockValue}
                            onChange={(e) => setStockValue(Number(e.target.value) || 0)}
                            className="w-20 h-8 text-sm"
                          />
                          <Button size="sm" onClick={() => updateStock(v.id)} disabled={saving}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            ×
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setEditingId(v.id); setStockValue(v.stock); }}
                          className={`text-lg font-semibold tabular-nums cursor-pointer hover:underline ${
                            v.stock === 0 ? "text-destructive" : v.stock <= 5 ? "text-[#ff9f2f]" : ""
                          }`}
                        >
                          {v.stock}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
