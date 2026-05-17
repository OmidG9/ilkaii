"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/currency";

type CheckoutClientProps = {
  action: (formData: FormData) => Promise<void>;
  defaultPhone?: string;
};

export default function CheckoutClient({
  action,
  defaultPhone,
}: CheckoutClientProps) {
  const items = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.cartTotal());
  const clearCart = useCartStore((state) => state.clearCart);
  const [paymentMethod, setPaymentMethod] = useState<
    "NETBANKING" | "DEBIT_CARD"
  >("NETBANKING");
  const [hasMounted, setHasMounted] = useState(false);
  const searchParams = useSearchParams();
  const paymentStatus = searchParams?.get("payment");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (paymentStatus === "success") {
      clearCart();
    }
  }, [paymentStatus, clearCart]);

  const activeItems = hasMounted ? items : [];
  const activeCartTotal = hasMounted ? cartTotal : 0;
  const cartJson = useMemo(() => JSON.stringify(items), [items]);
  const isCardToCard = paymentMethod === "DEBIT_CARD";

  return (
    <div className="container mx-auto px-4 py-12 lg:py-16">
      {paymentStatus === "success" && (
        <div className="mb-6 rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 text-emerald-800 shadow-sm">
          پرداخت با موفقیت انجام شد. تشکر از خرید شما.
        </div>
      )}
      {paymentStatus === "failed" && (
        <div className="mb-6 rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
          پرداخت ناموفق بود. لطفاً دوباره تلاش کنید یا روش دیگری انتخاب کنید.
        </div>
      )}

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
                  defaultValue={defaultPhone}
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

            <div className="grid gap-4">
              <p className="text-sm font-semibold text-luxury-text">
                روش پرداخت
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="rounded-3xl border border-luxury-border bg-luxury-background p-4 transition hover:border-luxury-primary">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-luxury-text">
                        پرداخت آنلاین با زرین‌پال
                      </p>
                      <p className="text-sm text-luxury-text/70">
                        پرداخت امن و سریع با درگاه آنلاین
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="NETBANKING"
                      checked={paymentMethod === "NETBANKING"}
                      onChange={() => setPaymentMethod("NETBANKING")}
                      className="h-4 w-4 text-luxury-primary"
                    />
                  </div>
                </label>

                <label className="rounded-3xl border border-luxury-border bg-luxury-background p-4 transition hover:border-luxury-primary">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-luxury-text">
                        پرداخت کارت به کارت (تست)
                      </p>
                      <p className="text-sm text-luxury-text/70">
                        این روش فقط برای تست خرید در محیط توسعه است.
                      </p>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="DEBIT_CARD"
                      checked={paymentMethod === "DEBIT_CARD"}
                      onChange={() => setPaymentMethod("DEBIT_CARD")}
                      className="h-4 w-4 text-luxury-primary"
                    />
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center rounded-3xl bg-luxury-primary px-6 py-4 text-base font-semibold text-white transition hover:bg-luxury-hover"
            >
              {isCardToCard
                ? "پرداخت کارت به کارت (تست)"
                : "پرداخت با زرین‌پال"}
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
            {activeItems.length === 0 ? (
              <p className="text-sm text-luxury-text/70">
                هنوز موردی در سبد خرید نیست.
              </p>
            ) : (
              activeItems.map((item) => (
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
                        {formatPrice(item.price)} x {item.quantity}
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
              {formatPrice(activeCartTotal)}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
