"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartView } from "@/services/cart";

interface CartContextValue {
  cart: CartView | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  add: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

async function readJson(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "خطای ارتباطی");
  return body.data;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setCart(await readJson(await fetch("/api/cart", { cache: "no-store" })));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطای ارتباطی");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const add = useCallback(async (productId: string, variantId?: string, quantity = 1) => {
    setCart(await readJson(await fetch("/api/cart/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, variantId, quantity }),
    })));
    setError(null);
  }, []);

  const update = useCallback(async (itemId: string, quantity: number) => {
    setCart(await readJson(await fetch(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantity }),
    })));
  }, []);

  const remove = useCallback(async (itemId: string) => {
    setCart(await readJson(await fetch(`/api/cart/items/${itemId}`, { method: "DELETE" })));
  }, []);

  const value = useMemo(() => ({ cart, loading, error, refresh, add, update, remove }), [cart, loading, error, refresh, add, update, remove]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
