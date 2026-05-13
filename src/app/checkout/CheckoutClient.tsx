"use client";

import { useMemo } from "react";
import { useCartStore } from "@/store/cartStore";

type CheckoutClientProps = {
  action: (formData: FormData) => Promise<void>;
};

export default function CheckoutClient({ action }: CheckoutClientProps) {
  const items = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.cartTotal());

  const cartJson = useMemo(() => JSON.stringify(items), [items]);

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-luxury-border bg-white p-8 shadow-sm">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-luxury-text/50">
              جزئیات ارسال
            </p>
            <h1 className="mt-3 text-3xl font-serif font-semibold text-luxury-text">
              سفارش خود را تکمیل کنید
            </h1>
          </div>

          <form action={action} className="space-y-5">
            <input type="hidden" name="cartJson" value={cartJson} />

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-luxury-text/80">
                نام کامل
                <input
                  name="fullName"
                  required
                  className="w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none focus:border-luxury-primary"
                />
              </label>
              <label className="space-y-2 text-sm text-luxury-text/80">
                شماره تلفن
                <input
                  name="phone"
                  required
                  className="w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none focus:border-luxury-primary"
                />
              </label>
            </div>

            <div className="space-y-4">
              <label className="space-y-2 text-sm text-luxury-text/80">
                آدرس
                <textarea
                  name="address"
                  required
                  rows={4}
                  className="w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none focus:border-luxury-primary"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-luxury-text/80">
                  کد پستی
                  <input
                    name="postalCode"
                    required
                    className="w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none focus:border-luxury-primary"
                  />
                </label>
                <label className="space-y-2 text-sm text-luxury-text/80">
                  شهر
                  <input
                    name="city"
                    required
                    className="w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none focus:border-luxury-primary"
                  />
                </label>
              </div>
              <label className="space-y-2 text-sm text-luxury-text/80">
                کشور
                <input
                  name="country"
                  required
                  className="w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none focus:border-luxury-primary"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-luxury-primary px-6 py-4 text-base font-semibold text-white transition hover:bg-luxury-hover"
            >
              پرداخت با زرین‌پال
            </button>
          </form>
        </section>

        <aside className="space-y-6 rounded-[32px] border border-luxury-border bg-white p-8 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-luxury-text/50">
              خلاصه سفارش
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-luxury-text">
              سبد خرید شما
            </h2>
          </div>

          <div className="space-y-4">
            {items.length === 0 ? (
              <p className="text-sm text-luxury-text/70">
                هنوز موردی در سبد خرید نیست.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-luxury-border bg-luxury-background p-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-3xl bg-white">
                      <img
                        src={item.heroImage}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-luxury-text">
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm text-luxury-text/70">
                        سایز {item.size ?? "استاندارد"}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-luxury-primary">
                        ﷼{item.price} x {item.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-3xl border border-luxury-border bg-luxury-background p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-luxury-text/50">
              مجموع کل
            </p>
            <p className="mt-3 text-3xl font-semibold text-luxury-text">
              ﷼{cartTotal.toFixed(2)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
