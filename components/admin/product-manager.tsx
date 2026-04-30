"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { DataTable } from "@/components/admin/data-table";
import { createProductColumns } from "@/components/admin/columns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminProduct, ProductFormValues } from "@/lib/types/admin";

const emptyForm: ProductFormValues = {
  slug: "",
  name: "",
  description: "",
  basePriceCents: 0,
  heroImageUrl: "",
  material: "",
  isActive: true,
};

type ProductManagerProps = {
  products: AdminProduct[];
};

export function ProductManager({ products }: ProductManagerProps) {
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        slug: editingProduct.slug,
        name: editingProduct.name,
        description: editingProduct.description,
        basePriceCents: editingProduct.basePriceHuf,
        heroImageUrl: editingProduct.heroImageUrl,
        material: editingProduct.material,
        isActive: editingProduct.isActive,
      });
      return;
    }

    setForm(emptyForm);
  }, [editingProduct]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const response = await fetch("/api/admin/products", {
      method: editingProduct ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(editingProduct ? { id: editingProduct.id } : {}),
        ...form,
      }),
    });

    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to save product");
      return;
    }

    toast.success(editingProduct ? "Product updated" : "Product created");
    setEditingProduct(null);
    setForm(emptyForm);
    router.refresh();
  }

  async function deleteProduct(product: AdminProduct) {
    const response = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to delete product");
      return;
    }

    if (editingProduct?.id === product.id) {
      setEditingProduct(null);
      setForm(emptyForm);
    }

    toast.success("Product deleted");
    router.refresh();
  }

  const columns = createProductColumns({
    onEdit: setEditingProduct,
    onDelete: deleteProduct,
  });

  return (
    <section className="space-y-6" id="products">
      <Card>
        <CardHeader>
          <CardTitle>{editingProduct ? "Edit product" : "Create product"}</CardTitle>
          <CardDescription>
            Manage storefront listings, pricing, and whether a product is available for checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="product-name">Name</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-slug">Slug</Label>
              <Input
                id="product-slug"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <textarea
                id="product-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className="border-input bg-background min-h-28 rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">Base price (HUF x100)</Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                value={form.basePriceCents}
                onChange={(event) =>
                  setForm((current) => ({ ...current, basePriceCents: Number(event.target.value) || 0 }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-material">Material</Label>
              <Input
                id="product-material"
                value={form.material}
                onChange={(event) => setForm((current) => ({ ...current, material: event.target.value }))}
                required
              />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="product-image">Hero image URL</Label>
              <Input
                id="product-image"
                value={form.heroImageUrl}
                onChange={(event) => setForm((current) => ({ ...current, heroImageUrl: event.target.value }))}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium lg:col-span-2">
              <input
                checked={form.isActive}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Active in store
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingProduct ? "Update product" : "Create product"}
              </Button>
              {editingProduct ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingProduct(null);
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
          <CardTitle>Products table</CardTitle>
          <CardDescription>Search, edit, archive, or remove product listings.</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <DataTable columns={columns} data={products} searchPlaceholder="Search products..." />
        </CardContent>
      </Card>
    </section>
  );
}
