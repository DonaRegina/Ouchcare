"use client";

import { create } from "zustand";

import type { CartItem } from "@/lib/types/domain";

type CartItemInput = CartItem & {
  measurement_id?: string;
  custom_size?: Record<string, unknown>;
};

type CartState = {
  items: CartItemInput[];
  addItem: (item: CartItemInput) => void;
  addToCart: (item: CartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalHuf: () => number;
};

function mergeCartItem(existing: CartItemInput, incoming: CartItemInput): CartItemInput {
  return {
    ...existing,
    ...incoming,
    quantity: existing.quantity + incoming.quantity,
    measurement_id: existing.measurement_id ?? incoming.measurement_id,
    custom_size: existing.custom_size ?? incoming.custom_size,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.id === item.id);
      if (existing) {
        return {
          items: state.items.map((entry) => (entry.id === item.id ? mergeCartItem(entry, item) : entry)),
        };
      }
      return { items: [...state.items, item] };
    }),
  addToCart: (item) =>
    set((state) => {
      const existing = state.items.find((entry) => entry.id === item.id);
      if (existing) {
        return {
          items: state.items.map((entry) => (entry.id === item.id ? mergeCartItem(entry, item) : entry)),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
    })),
  clearCart: () => set({ items: [] }),
  totalHuf: () => get().items.reduce((sum, item) => sum + item.unitPriceHuf * item.quantity, 0),
}));
