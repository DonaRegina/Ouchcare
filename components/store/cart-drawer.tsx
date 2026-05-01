"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";

import { useCartStore } from "@/lib/store/cart-store";
import { CURRENCY } from "@/lib/constants/mock-data";

export default function CartDrawer() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalHuf = useCartStore((s) => s.totalHuf());
  const [open, setOpen] = useState(false);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    setOpen(false);
    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="relative rounded-full"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalQuantity > 0 && (
            <span className="pointer-events-none absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-[#239fb1] px-2 py-0.5 text-xs font-semibold text-white">
              {totalQuantity}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-sm">
        <SheetHeader>
          <SheetTitle>Cart</SheetTitle>
        </SheetHeader>

        <div className="mt-2 space-y-4 px-4">
          {items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                Your cart is empty
              </p>
              <Link
                href="/shop"
                className="text-sm font-medium text-[#239fb1] hover:underline"
                onClick={() => setOpen(false)}
              >
                Browse shop
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-[#bff1f5] p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium break-words">{item.name}</p>
                    <p className="text-muted-foreground text-sm">
                      Qty {item.quantity}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <span className="font-medium">
                      {CURRENCY.format(item.unitPriceHuf)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="mt-2"
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="px-4">
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 p-4">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">
                {CURRENCY.format(totalHuf)}
              </span>
            </div>

            <Button
              className="w-full min-h-11 bg-[#239fb1] text-white hover:bg-[#1c7f90]"
              onClick={handleCheckout}
              disabled={items.length === 0}
            >
              Proceed to Checkout
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
