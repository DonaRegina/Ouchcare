"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";

type BuyNowButtonProps = {
  product: {
    id: string;
    name: string;
    price: number;
  };
  className?: string;
};

export function BuyNowButton({ product, className }: BuyNowButtonProps) {
  const router = useRouter();
  const cartStore = useCartStore();

  return (
    <Button
      className={className}
      onClick={() => {
        cartStore.addItem({ id: product.id, name: product.name, unitPriceHuf: product.price, quantity: 1 } as never);
        router.push("/checkout");
      }}
    >
      Buy now
    </Button>
  );
}
