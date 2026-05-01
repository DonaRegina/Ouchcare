"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { DataTable } from "@/components/admin/data-table";
import { createProductColumns } from "@/components/admin/columns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminProduct, AdminProductVariant, ProductFormValues } from "@/lib/types/admin";

const SIZE_OPTIONS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "CUSTOM"];

const emptyForm: ProductFormValues = {
  slug: "",
  name: "",
  description: "",
  basePriceHuf: 0,
  heroImageUrl: "",
  material: "",
  isActive: true,
};

type VariantDraft = {
  size: string;
  material: string;
  priceHuf: number;
  stock: number;
};

type ProductManagerProps = {
  products: AdminProduct[];
  variants?: AdminProductVariant[];
};

export function ProductManager({ products, variants = [] }: ProductManagerProps) {
  const router = useRouter();
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Variant management
  const [variantDraft, setVariantDraft] = useState<VariantDraft>({ size: "M", material: "Full Cotton", priceHuf: 0, stock: 50 });
  const [savingVariant, setSavingVariant] = useState(false);

  const editingVariants = editingProduct
    ? variants.filter((v) => v.productId === editingProduct.id)
    : [];

  useEffect(() => {
    if (editingProduct) {
      setForm({
        slug: editingProduct.slug,
        name: editingProduct.name,
        description: editingProduct.description,
        basePriceHuf: editingProduct.basePriceHuf,
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

  async function addVariant() {
    if (!editingProduct) return;
    setSavingVariant(true);

    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addVariant: true,
        productId: editingProduct.id,
        size: variantDraft.size,
        material: variantDraft.material,
        priceHuf: variantDraft.priceHuf,
        stock: variantDraft.stock,
      }),
    });

    setSavingVariant(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      toast.error(payload.error ?? "Unable to add variant");
      return;
    }

    toast.success(`${variantDraft.size} variant added`);
    router.refresh();
  }

  async function deleteVariant(variantId: string) {
    const response = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteVariant: true, variantId }),
    });

    if (!response.ok) {
      toast.error("Unable to delete variant");
      return;
    }

    toast.success("Variant removed");
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
            {editingProduct
              ? "Update product details and manage size variants below."
              : "Add a new product to the catalog. After creating it, edit it to add size variants."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 lg:grid-cols-2" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="product-name">Name</Label>
              <Input id="product-name" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-slug">Slug</Label>
              <Input id="product-slug" value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))} required />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="product-description">Description</Label>
              <textarea
                id="product-description"
                value={form.description}
                onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                className="border-input bg-background min-h-28 rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">Base price (HUF)</Label>
              <Input id="product-price" type="number" min="0" value={form.basePriceHuf} onChange={(e) => setForm((c) => ({ ...c, basePriceHuf: Number(e.target.value) || 0 }))} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-material">Default material</Label>
              <Input id="product-material" value={form.material} onChange={(e) => setForm((c) => ({ ...c, material: e.target.value }))} required />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <Label htmlFor="product-image">Hero image URL</Label>
              <Input id="product-image" value={form.heroImageUrl} onChange={(e) => setForm((c) => ({ ...c, heroImageUrl: e.target.value }))} required />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium lg:col-span-2">
              <input checked={form.isActive} type="checkbox" onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.checked }))} />
              Active in store
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingProduct ? "Update product" : "Create product"}</Button>
              {editingProduct && (
                <Button type="button" variant="outline" onClick={() => { setEditingProduct(null); setForm(emptyForm); }}>Cancel edit</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Variant management — only when editing */}
      {editingProduct && (
        <Card>
          <CardHeader>
            <CardTitle>Size Variants for {editingProduct.name}</CardTitle>
            <CardDescription>Each variant is a size + material + price + stock combination that customers can select.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing variants */}
            {editingVariants.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {editingVariants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Badge variant="outline">{v.size}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">Stock: {v.stock}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.additionalPriceCents !== 0 ? `+${v.additionalPriceCents} HUF` : "Base price"}
                      </p>
                    </div>
                    <Button size="icon-sm" variant="destructive" onClick={() => deleteVariant(v.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No variants yet. Add at least one size to make this product available in the shop.</p>
            )}

            {/* Add new variant form */}
            <div className="rounded-lg border border-dashed p-4 space-y-3">
              <p className="text-sm font-medium">Add a variant</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="grid gap-1">
                  <Label className="text-xs">Size</Label>
                  <select
                    value={variantDraft.size}
                    onChange={(e) => setVariantDraft((c) => ({ ...c, size: e.target.value }))}
                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  >
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Material</Label>
                  <Input value={variantDraft.material} onChange={(e) => setVariantDraft((c) => ({ ...c, material: e.target.value }))} placeholder="Full Cotton" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Price (HUF)</Label>
                  <Input type="number" min="0" value={variantDraft.priceHuf} onChange={(e) => setVariantDraft((c) => ({ ...c, priceHuf: Number(e.target.value) || 0 }))} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs">Stock</Label>
                  <Input type="number" min="0" value={variantDraft.stock} onChange={(e) => setVariantDraft((c) => ({ ...c, stock: Number(e.target.value) || 0 }))} />
                </div>
              </div>
              <Button size="sm" onClick={addVariant} disabled={savingVariant}>
                <Plus className="mr-1 size-3.5" />
                {savingVariant ? "Adding..." : "Add variant"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Products table</CardTitle>
          <CardDescription>Search, edit, archive, or remove product listings.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={products} searchPlaceholder="Search products..." />
        </CardContent>
      </Card>
    </section>
  );
}
