"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";
import { createClient } from "@/lib/supabase/client";

type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "cancelled";

export default function CheckoutSuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [pollingDone, setPollingDone] = useState(false);
  const hasCleared = useRef(false);

  // Clear cart and show initial toast once on mount
  useEffect(() => {
    if (hasCleared.current) return;
    hasCleared.current = true;
    clearCart();
    toast.success("Payment received — your order is being confirmed.");
  }, [clearCart]);

  // Poll the most recent order to confirm the Stripe webhook updated it
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;
    const intervalMs = 2000;

    async function pollOrder() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPollingDone(true);
        return;
      }

      const timer = setInterval(async () => {
        if (cancelled || attempts >= maxAttempts) {
          clearInterval(timer);
          if (!cancelled) setPollingDone(true);
          return;
        }

        attempts++;

        const { data } = await supabase
          .from("orders")
          .select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!data || cancelled) return;

        const status = data.status as OrderStatus;
        setOrderStatus(status);

        if (status === "paid" || status === "processing" || status === "shipped") {
          clearInterval(timer);
          setPollingDone(true);
          toast.success("Order confirmed and payment verified!");
        } else if (status === "cancelled") {
          clearInterval(timer);
          setPollingDone(true);
          toast.error("Something went wrong — your order was cancelled. Please contact support.");
        }
      }, intervalMs);
    }

    void pollOrder();
    return () => { cancelled = true; };
  }, []);

  const confirmed = orderStatus === "paid" || orderStatus === "processing" || orderStatus === "shipped";

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-3">
        {confirmed ? (
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        ) : !pollingDone ? (
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
        ) : (
          <CheckCircle2 className="mx-auto h-12 w-12 text-yellow-500" />
        )}

        <h1 className="text-4xl font-semibold tracking-tight">
          {confirmed ? "Order confirmed!" : pollingDone ? "Order placed!" : "Confirming your order\u2026"}
        </h1>

        <p className="text-muted-foreground">
          {confirmed
            ? "Your payment has been verified. You can track your order in your account."
            : pollingDone
              ? "Your payment is still being processed. Check your orders page shortly."
              : "Verifying your payment with Stripe. This usually takes a few seconds."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="min-h-11 px-6">
          <Link href="/my-orders">View my orders</Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-6">
          <Link href="/shop">Back to Shop</Link>
        </Button>
      </div>
    </section>
  );
}