"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants/mock-data";
import { useCartStore } from "@/lib/store/cart-store";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const items = useCartStore((state) => state.items);
  const subtotalHuf = useCartStore((state) => state.totalHuf());

  // Shipping state
  const [country, setCountry] = useState<string>(""); // default: no country selected
  const [shippingMethod, setShippingMethod] = useState<string>(""); // id/label of selected method
  const [shippingCost, setShippingCost] = useState<number>(0); // default 0

  // Country zone groups as specified
  const EU_COUNTRIES = [
    "Austria",
    "Belgium",
    "Bulgaria",
    "Croatia",
    "Cyprus",
    "Czech Republic",
    "Denmark",
    "Estonia",
    "Finland",
    "France",
    "Germany",
    "Greece",
    "Ireland",
    "Italy",
    "Latvia",
    "Lithuania",
    "Luxembourg",
    "Malta",
    "Monaco",
    "Netherlands",
    "Poland",
    "Portugal",
    "Romania",
    "Slovakia",
    "Slovenia",
    "Spain",
    "Sweden",
  ];

  const EUROPE_NON_EU = [
    "Albania",
    "Andorra",
    "Armenia",
    "Azerbaijan",
    "Belarus",
    "Bosnia-Herzegovina",
    "Georgia",
    "Gibraltar",
    "Great Britain",
    "Iceland",
    "Kosovo",
    "Liechtenstein",
    "Moldova",
    "Montenegro",
    "North Macedonia",
    "Norway",
    "Russia",
    "San Marino",
    "Serbia",
    "Switzerland",
    "Turkey",
    "Ukraine",
    "Vatican",
  ];

  // Other International includes listed examples and "Other"
  const OTHER_INTERNATIONAL = ["USA", "China", "Hong Kong", "Other"];

  type Method = { id: string; label: string; cost: number };

  const EU_AND_EUR_NON_EU_METHODS: Method[] = [
    { id: "priority-500", label: "Priority Letter (up to 500g)", cost: 2600 },
    { id: "priority-2000", label: "Priority Letter (up to 2000g)", cost: 8500 },
    {
      id: "nonpriority-500",
      label: "Non-Priority Letter (up to 500g)",
      cost: 2500,
    },
    {
      id: "nonpriority-2000",
      label: "Non-Priority Letter (up to 2000g)",
      cost: 7700,
    },
  ];

  const OTHER_INTERNATIONAL_METHODS: Method[] = [
    { id: "priority-500", label: "Priority Letter (up to 500g)", cost: 3000 },
    {
      id: "priority-2000",
      label: "Priority Letter (up to 2000g)",
      cost: 11000,
    },
    {
      id: "nonpriority-500",
      label: "Non-Priority Letter (up to 500g)",
      cost: 3000,
    },
    {
      id: "nonpriority-2000",
      label: "Non-Priority Letter (up to 2000g)",
      cost: 10000,
    },
    {
      id: "parcel-np-1kg",
      label: "Parcel Non-Priority (up to 1kg)",
      cost: 18000,
    },
    {
      id: "parcel-np-2kg",
      label: "Parcel Non-Priority (up to 2kg)",
      cost: 18500,
    },
  ];

  // Determine zone from selected country
  function getZoneFromCountry(
    countryName: string,
  ): "EU" | "EUR_NON_EU" | "OTHER" | null {
    if (!countryName) return null;
    if (EU_COUNTRIES.includes(countryName)) return "EU";
    if (EUROPE_NON_EU.includes(countryName)) return "EUR_NON_EU";
    if (OTHER_INTERNATIONAL.includes(countryName)) return "OTHER";
    // Anything else treat as OTHER
    return "OTHER";
  }

  // Available methods derived from selected country
  const availableMethods = useMemo<Method[]>(() => {
    const zone = getZoneFromCountry(country);
    if (zone === "EU" || zone === "EUR_NON_EU")
      return EU_AND_EUR_NON_EU_METHODS;
    if (zone === "OTHER") return OTHER_INTERNATIONAL_METHODS;
    return []; // no country selected => no methods
  }, [country]);

  // When country changes, reset method if not available
  function onCountryChange(val: string) {
    setCountry(val);
    // Reset shipping selection whenever country changes
    setShippingMethod("");
    setShippingCost(0);
  }

  function onMethodChange(methodId: string) {
    // If no method selected (falsy), clear selection and cost
    if (!methodId) {
      setShippingMethod("");
      setShippingCost(0);
      return;
    }
    setShippingMethod(methodId);
    // Lookup cost from the currently available methods and apply it
    const method = availableMethods.find((m) => m.id === methodId);
    setShippingCost(method ? method.cost : 0);
  }

  async function startCheckout() {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    // Capture label before async operations
    const shippingLabel =
      availableMethods.find((m) => m.id === shippingMethod)?.label ??
      shippingMethod ??
      "Shipping";

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            unitPriceHuf: item.unitPriceHuf,
            quantity: item.quantity,
            measurement_id: item.measurement_id,
            custom_size: item.custom_size,
          })),
          shipping_cost: shippingCost,
          shipping_method: shippingLabel, // use label here
          shipping_country: country || null,
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Unable to start Stripe Checkout.");
        return;
      }

      if (!data.url) {
        toast.error("Stripe did not return a checkout URL.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start Stripe Checkout.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const totalHuf = subtotalHuf + (shippingCost ?? 0);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
      <p className="text-muted-foreground max-w-2xl">
        Review your cart and continue to Stripe for secure payment.
      </p>
      <div className="space-y-4 rounded-lg border p-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground">Your cart is empty.</p>
        ) : null}
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md border bg-background p-3"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-muted-foreground text-sm">
                  Qty {item.quantity}
                </p>
              </div>
              <span className="font-medium">
                {CURRENCY.format(item.unitPriceHuf * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {/* Shipping Section */}
        <div className="space-y-2 border-t pt-4">
          <h2 className="text-lg font-medium">Shipping</h2>
          <p className="text-sm text-muted-foreground">
            Select a destination country and shipping method. Default: no
            country selected, shipping = 0 Ft.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <Select value={country} onValueChange={onCountryChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>EU Countries</SelectLabel>
                    {EU_COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>European Non-EU</SelectLabel>
                    {EUROPE_NON_EU.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel>Other International</SelectLabel>
                    {OTHER_INTERNATIONAL.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Shipping Method
              </label>
              <Select
                value={shippingMethod ?? ""}
                onValueChange={onMethodChange}
              >
                <SelectTrigger className="w-full" disabled={!country}>
                  <SelectValue
                    placeholder={
                      country ? "Select method" : "Select country first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableMethods.length === 0 ? (
                    <SelectGroup>
                      <SelectLabel>No methods</SelectLabel>
                    </SelectGroup>
                  ) : (
                    <SelectGroup>
                      <SelectLabel>Available Methods</SelectLabel>
                      {availableMethods.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label} — {CURRENCY.format(m.cost)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Selected:{" "}
                {shippingMethod !== ""
                  ? `${availableMethods.find((m) => m.id === shippingMethod)?.label ?? shippingMethod}`
                  : "None"}{" "}
                — {CURRENCY.format(shippingCost)}
              </p>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="flex flex-col gap-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Subtotal</span>
            <span>{CURRENCY.format(subtotalHuf)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Shipping</span>
            <span>{CURRENCY.format(shippingCost)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-lg font-semibold">
              {CURRENCY.format(totalHuf)}
            </span>
          </div>
        </div>

        <Button
          className="w-full min-h-11"
          disabled={items.length === 0 || loading}
          onClick={startCheckout}
        >
          {loading ? "Redirecting to Stripe..." : "Proceed to Stripe Checkout"}
        </Button>
        <p className="text-muted-foreground text-sm">
          Need to change something?{" "}
          <Link href="/shop" className="underline underline-offset-4">
            Back to shop
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
