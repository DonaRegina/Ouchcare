"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";

export default function CheckoutSuccessPage() {
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <section className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Order confirmed!</h1>
        <p className="text-muted-foreground">
          Your payment went through successfully. We’ve cleared your cart and you can continue shopping.
        </p>
      </div>
      <Button asChild className="min-h-11 px-6">
        <Link href="/shop">Back to Shop</Link>
      </Button>
    </section>
  );
}