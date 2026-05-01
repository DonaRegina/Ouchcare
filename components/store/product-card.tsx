"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY } from "@/lib/constants/mock-data";
import { useCartStore } from "@/lib/store/cart-store";

type Variant = {
  id: string;
  size: string;
  material: string;
  price_huf: number;
};
type ProductProp = { id: string; name: string; variants: Variant[] };
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

export default function ProductCard({ product }: { product: ProductProp }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const materials = useMemo(() => {
    const unique = Array.from(new Set(product.variants.map((v) => v.material)));
    return unique.sort((a, b) =>
      a === "Full Cotton" ? -1 : b === "Full Cotton" ? 1 : a.localeCompare(b),
    );
  }, [product.variants]);

  const sizesForMaterial = (mat: string) =>
    SIZE_ORDER.filter((s) =>
      product.variants.some((v) => v.material === mat && v.size === s),
    );

  const defaultMaterial = materials.includes("Full Cotton")
    ? "Full Cotton"
    : (materials[0] ?? "");
  const [material, setMaterial] = useState(defaultMaterial);
  const [size, setSize] = useState(() => {
    const avail = sizesForMaterial(defaultMaterial);
    return avail.includes("S") ? "S" : (avail[0] ?? "");
  });

  useEffect(() => {
    const avail = sizesForMaterial(material);
    if (!avail.includes(size))
      setSize(avail.includes("S") ? "S" : (avail[0] ?? ""));
  }, [material]);

  const selectedVariant = product.variants.find(
    (v) => v.material === material && v.size === size,
  );
  const priceDisplay = selectedVariant
    ? CURRENCY.format(selectedVariant.price_huf)
    : "—";
  const sizeOptions = sizesForMaterial(material);

  const handleBuyNow = () => {
    if (!selectedVariant) return;
    addItem({
      id: product.id,
      name: product.name,
      unitPriceHuf: selectedVariant.price_huf,
      quantity: 1,
      variant_id: selectedVariant.id,
    } as never);
    router.push("/checkout");
  };

  return (
    <div className="w-full grid gap-3">
      <div>
        <label className="text-sm font-medium block mb-1 text-[#166674] dark:text-[#96e7ee]">Material</label>
        <Select value={material} onValueChange={setMaterial}>
          <SelectTrigger className="w-full border-[#bff1f5] dark:border-[#1c7f90]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {materials.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="text-xs text-[#1c7f90] dark:text-[#96e7ee]/70">Price</div>
        <div className="text-lg font-semibold text-[#0e414a] dark:text-[#dff8fb]">{priceDisplay}</div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 border-[#239fb1] text-[#239fb1] hover:bg-[#effcfe] hover:text-[#166674] dark:border-[#37bfd0] dark:text-[#37bfd0] dark:hover:bg-[#12525d]"
          onClick={() => {
            if (!selectedVariant) return;
            addItem({
              id: product.id,
              name: product.name,
              unitPriceHuf: selectedVariant.price_huf,
              quantity: 1,
              variant_id: selectedVariant.id,
            } as never);
            import("sonner").then(({ toast }) =>
              toast.success("Added to cart!"),
            );
          }}
          disabled={!selectedVariant}
        >
          Add to Cart
        </Button>

        <Button
          onClick={handleBuyNow}
          disabled={!selectedVariant}
          className="flex-1 bg-[#ff9f2f] text-white hover:bg-[#f18d1c] dark:bg-[#ffb13a] dark:text-[#0e414a] dark:hover:bg-[#ff9f2f]"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
