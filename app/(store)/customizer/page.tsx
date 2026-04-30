"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cart-store";
import { CURRENCY } from "@/lib/constants/mock-data";

type Variant = {
  id: string;
  product_id?: string;
  size: string;
  material: string;
  price_huf: number;
};

type Product = {
  id: string;
  name: string;
};

type MeasurementRow = {
  id?: string;
  user_id?: string;
  pet_name?: string | null;
  neck_cm: number;
  chest_cm: number;
  back_length_cm: number;
  leg_girth_cm: number;
  created_at?: string;
};

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];

function recommendSizeFromChest(chest: number) {
  if (chest < 30) return "XXS";
  if (chest < 35) return "XS";
  if (chest < 40) return "S";
  if (chest < 45) return "M";
  if (chest < 50) return "L";
  if (chest < 55) return "XL";
  return "XXL";
}

export default function CustomizerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const measurementId = searchParams?.get("measurement_id") ?? null;

  const addItem = useCartStore((s) => s.addItem);

  const [loading, setLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userPresent, setUserPresent] = useState(true);

  const [measurement, setMeasurement] = useState<MeasurementRow | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function protectAndLoad() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!user) {
          setUserPresent(false);
          router.replace("/login");
          return;
        }

        setUserPresent(true);

        if (!measurementId) {
          // no measurement id provided; nothing to fetch
          setLoading(false);
          setSessionChecked(true);
          return;
        }

        // Try fetching measurement by id, then by created_at if not found
        let measurementRes = await supabase
          .from("measurements")
          .select(
            "id, user_id, pet_name, neck, chest, back_length, leg_girth, created_at",
          )
          .eq("id", measurementId)
          .maybeSingle();

        if (!measurementRes.data) {
          measurementRes = await supabase
            .from("measurements")
            .select(
              "id, user_id, pet_name, neck, chest, back_length, leg_girth, created_at",
            )
            .eq("created_at", measurementId)
            .maybeSingle();
        }

        if (measurementRes.error) {
          console.error("Error fetching measurement:", measurementRes.error);
        } else if (measurementRes.data) {
          setMeasurement(measurementRes.data as MeasurementRow);
        } else {
          setMeasurement(null);
        }

        // Find Recovery Vest product dynamically. Prefer slug 'recover-suit', fallback to name match.
        let productRes = await supabase
          .from("products")
          .select("id, name")
          .eq("slug", "recover-suit")
          .limit(1)
          .maybeSingle();

        if (!productRes.data) {
          productRes = await supabase
            .from("products")
            .select("id, name")
            .ilike("name", "%Recovery Vest%")
            .limit(1)
            .maybeSingle();
        }

        if (productRes.error) {
          console.error("Error fetching product:", productRes.error);
        } else if (productRes.data) {
          setProduct(productRes.data as Product);

          // fetch variants for product
          const { data: vdata, error: verr } = await supabase
            .from("product_variants")
            .select("id, size, material, price_huf")
            .eq("product_id", productRes.data.id)
            .order("price_huf", { ascending: true });

          if (verr) {
            console.error("Error fetching variants:", verr);
            setVariants([]);
            setMaterials([]);
          } else {
            const fetched = (vdata ?? []) as Variant[];
            setVariants(fetched);
            const uniqMaterials = Array.from(
              new Set(fetched.map((v) => v.material)),
            );
            // Prefer "Full Cotton" if present
            uniqMaterials.sort((a, b) =>
              a === "Full Cotton"
                ? -1
                : b === "Full Cotton"
                  ? 1
                  : a.localeCompare(b),
            );
            setMaterials(uniqMaterials);
            const defaultMat = uniqMaterials.includes("Full Cotton")
              ? "Full Cotton"
              : (uniqMaterials[0] ?? "");
            setSelectedMaterial(defaultMat);
          }
        } else {
          setProduct(null);
          setVariants([]);
        }
      } catch (err) {
        console.error("Unexpected error in customizer load:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          setSessionChecked(true);
        }
      }
    }

    void protectAndLoad();

    return () => {
      mounted = false;
    };
  }, [measurementId, router]);

  // when measurement arrives, preselect size based on chest
  useEffect(() => {
    if (!measurement) return;
    const rec = recommendSizeFromChest(measurement.chest_cm);
    setSelectedSize(rec);
  }, [measurement]);

  // make sure selected size is supported by selected material; if not, pick first supported
  useEffect(() => {
    if (!variants.length || !selectedMaterial) return;

    const supportedSizes = SIZE_ORDER.filter((s) =>
      variants.some((v) => v.material === selectedMaterial && v.size === s),
    );
    if (supportedSizes.length === 0) {
      // nothing supported: keep selectedSize as-is
      return;
    }
    if (!supportedSizes.includes(selectedSize)) {
      // try to pick the recommended or fallback to the first supported
      const recommended = recommendSizeFromChest(measurement?.chest_cm ?? 0);
      setSelectedSize(
        supportedSizes.includes(recommended) ? recommended : supportedSizes[0],
      );
    }
  }, [selectedMaterial, variants, measurement, selectedSize]);

  const availableSizesForMaterial = useMemo(() => {
    if (!selectedMaterial) return [];
    return SIZE_ORDER.filter((s) =>
      variants.some((v) => v.material === selectedMaterial && v.size === s),
    );
  }, [variants, selectedMaterial]);

  const selectedVariant = useMemo(() => {
    return (
      variants.find(
        (v) => v.material === selectedMaterial && v.size === selectedSize,
      ) ?? null
    );
  }, [variants, selectedMaterial, selectedSize]);

  const priceDisplay = selectedVariant
    ? CURRENCY.format(selectedVariant.price_huf)
    : "—";

  if (!sessionChecked && loading) {
    return (
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Customize Recovery Vest
        </h1>
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
          Loading...
        </div>
      </section>
    );
  }

  if (!userPresent) {
    return null; // redirected to login already
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        Customize Recovery Vest
      </h1>
      <p className="text-muted-foreground max-w-2xl">
        Build a tailored Recovery Vest using your saved measurement profile.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Measurement summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!measurement ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                No measurement found. Make sure the link includes a valid
                measurement_id or add measurements in your account.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Pet</p>
                  <p className="font-semibold">
                    {measurement.pet_name ?? "Unnamed"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Neck</p>
                  <p className="font-semibold">{measurement.neck} cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chest</p>
                  <p className="font-semibold">{measurement.chest} cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Back length</p>
                  <p className="font-semibold">{measurement.back_length} cm</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leg girth</p>
                  <p className="font-semibold">{measurement.leg_girth} cm</p>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Material
                </label>
                <Select
                  value={selectedMaterial}
                  onValueChange={(v) => setSelectedMaterial(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select material" />
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
                <label className="text-sm font-medium block mb-1">Size</label>
                <Select
                  value={selectedSize}
                  onValueChange={(v) => setSelectedSize(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizesForMaterial.length === 0 ? (
                      <SelectItem value={selectedSize ?? "M"}>
                        {selectedSize}
                      </SelectItem>
                    ) : (
                      availableSizesForMaterial.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Price</p>
              <div className="text-lg font-semibold">{priceDisplay}</div>
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="text-sm font-medium block mb-1">
                Notes / Special instructions
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border px-3 py-2 text-sm shadow-xs"
                placeholder="Add any special fitting notes, preferred finish, or veterinary instructions."
              />
            </div>
          </CardContent>
          <div className="px-6 pb-6 pt-4 border-t">
            <Button
              className="w-full"
              onClick={() => {
                if (!product || !selectedVariant || !measurement) {
                  // simple client-side validation / feedback
                  return;
                }

                addItem({
                  id: product.id,
                  name: "Custom Recovery Vest",
                  unitPriceHuf: selectedVariant.price_huf,
                  quantity: 1,
                  variant_id: selectedVariant.id,
                  measurement_id:
                    measurement.id ?? measurement.created_at ?? null,
                  custom_size: {
                    neck: measurement.neck_cm,
                    chest: measurement.chest_cm,
                    back_length: measurement.back_length_cm,
                    leg_girth: measurement.leg_girth_cm,
                  },
                } as any);

                router.push("/checkout");
              }}
              disabled={!selectedVariant || !measurement || !product}
            >
              Add to Cart
            </Button>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-semibold">Custom Recovery Vest</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Material</span>
              <span>{selectedMaterial || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Size</span>
              <span>{selectedSize}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unit price</span>
              <span className="font-semibold">{priceDisplay}</span>
            </div>

            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total</span>
                <span className="text-2xl font-semibold">
                  {selectedVariant
                    ? CURRENCY.format(selectedVariant.price_huf)
                    : "—"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
