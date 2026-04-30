"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CURRENCY } from "@/lib/constants/mock-data";
import { useCartStore } from "@/lib/store/cart-store";

export function CartPanel() {
  const [loading, setLoading] = useState(false);
  const [handledSessionId, setHandledSessionId] = useState<string | null>(null);
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalHuf = useCartStore((state) => state.totalHuf());

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");

    if (checkout === "success" && sessionId && handledSessionId !== sessionId) {
      clearCart();
      setHandledSessionId(sessionId);
      toast.success("Payment confirmed. Your order has been placed.");
    }

    if (checkout === "cancelled") {
      toast.message("Checkout was cancelled. Your cart is still available.");
    }
  }, [clearCart, handledSessionId]);

  async function startCheckout() {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const data = (await response.json()) as { checkoutUrl?: string; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Unable to start checkout.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      toast.error("Stripe did not provide a checkout URL.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start checkout.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Cart</h2>
      {items.length === 0 ? <p className="text-muted-foreground">Your cart is empty.</p> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border p-3 sm:flex sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium break-words">{item.name}</p>
              <p className="text-muted-foreground text-sm">
                Size {item.size} · Qty {item.quantity}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:mt-0 sm:justify-end">
              <span className="font-medium">{CURRENCY.format(item.unitPriceHuf * item.quantity)}</span>
              <Button variant="outline" size="sm" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name} from cart`}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between rounded-md border bg-muted/30 p-4">
        <span className="font-medium">Total</span>
        <span className="text-lg font-semibold">{CURRENCY.format(totalHuf)}</span>
      </div>
      <Button className="w-full min-h-11" disabled={items.length === 0 || loading} onClick={startCheckout}>
        {loading ? "Preparing checkout..." : "Proceed to Stripe checkout"}
      </Button>
    </section>
  );
}
