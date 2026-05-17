"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/currency";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.cartTotal());
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeItems = isMounted ? items : [];
  const activeCartTotal = isMounted ? cartTotal : 0;
  const motionProps = isMounted
    ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }
    : {};

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      <div className="flex flex-col gap-8 lg:flex-row">
        <section className="lg:w-8/12">
          <div className="mb-6 rounded-[32px] border border-luxury-border bg-white p-6 shadow-sm">
            <h1 className="text-3xl font-serif font-semibold text-luxury-text">
              سبد خرید
            </h1>
            <p className="mt-3 text-sm text-luxury-text/70">
              آیتم‌های انتخابی خود را قبل از پرداخت بررسی کنید.
            </p>
          </div>

          {activeItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-dashed border-luxury-border bg-luxury-background p-10 text-center"
            >
              <p className="text-lg font-medium text-luxury-text">
                سبد خرید شما خالی است.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-block rounded-3xl bg-luxury-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-luxury-hover"
              >
                مشاهده محصولات
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {activeItems.map((item) => (
                <motion.div
                  key={item.id}
                  {...motionProps}
                  className="rounded-[32px] border border-luxury-border bg-white p-6 shadow-sm"
                >
                  <div className="grid gap-5 sm:grid-cols-[120px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-[28px] bg-luxury-background">
                      <img
                        src={item.heroImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-luxury-text/60">
                          {item.size ? `سایز ${item.size}` : "استاندارد"}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-luxury-text">
                          {item.name}
                        </h2>
                        <p className="mt-3 text-sm text-luxury-text/70">
                          {item.quantity} x {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="rounded-full border border-luxury-border px-4 py-2 text-sm text-luxury-text transition hover:bg-luxury-background"
                        >
                          –
                        </button>
                        <span className="min-w-[40px] text-center text-sm font-semibold text-luxury-text">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="rounded-full border border-luxury-border px-4 py-2 text-sm text-luxury-text transition hover:bg-luxury-background"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="rounded-3xl border border-luxury-border px-4 py-2 text-sm text-luxury-text/70 transition hover:bg-luxury-background"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="flex flex-col gap-4 rounded-[32px] border border-luxury-border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-luxury-text/60">
                    جمع جزئی
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-luxury-text">
                    {formatPrice(activeCartTotal)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded-3xl border border-luxury-border px-6 py-3 text-sm font-medium text-luxury-text transition hover:bg-luxury-background"
                  >
                    خالی کردن سبد
                  </button>
                  <Link
                    href="/checkout"
                    className="rounded-3xl bg-luxury-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-luxury-hover"
                  >
                    پرداخت
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
