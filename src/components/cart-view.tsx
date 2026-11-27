"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import type { CartView as CartViewType } from "@/services/cart";
import { formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";

export function CartView({ initialCart, shipping, freeThreshold }: {
  initialCart: CartViewType;
  shipping: number;
  freeThreshold: number;
}) {
  const router = useRouter();
  const { cart, update, remove, error } = useCart();
  const view = cart ?? initialCart;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setLocalError(null);
    try {
      await action();
      router.refresh();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "خطای ارتباطی");
    } finally {
      setBusyId(null);
    }
  };

  if (!view.items.length) {
    return (
      <Card className="relative overflow-hidden p-10 text-center">
        <span aria-hidden className="pointer-events-none absolute -left-4 -top-6 font-display text-[150px] leading-none text-primary/[0.06]">0</span>
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="relative mt-5 text-xl font-semibold">سبد خرید خالی است</h1>
        <p className="relative mt-2 text-sm text-ink/55">از تازه‌ها شروع کنید یا کالکشن‌ها را ببینید.</p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop">رفتن به فروشگاه</ButtonLink>
          <ButtonLink href="/new-arrivals" variant="outline">دیدن تازه‌ها</ButtonLink>
        </div>
      </Card>
    );
  }

  const remaining = Math.max(0, freeThreshold - view.subtotal);
  const total = view.subtotal + shipping;
  const progress = freeThreshold > 0 ? Math.min(100, Math.round((view.subtotal / freeThreshold) * 100)) : 100;
  const hasUnavailable = view.items.some((item) => !item.available);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {view.items.map((item) => (
          <Card key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <Link href={`/product/${item.slug}`} className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-line/30">
              {item.image ? <Image src={item.image} alt={item.productName} fill sizes="96px" className="object-cover" /> : null}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${item.slug}`} className="text-sm font-semibold hover:text-primary">{item.productName}</Link>
              <p className="mt-1 text-xs text-ink/55">
                {[item.size, item.color].filter(Boolean).join(" / ") || "بدون تنوع"}
              </p>
              <p className="mt-1 text-sm font-medium text-primary" dir="ltr">{formatToman(item.unitPrice)}</p>
              {!item.available ? <p className="mt-1 text-xs text-red-600">موجودی کافی نیست</p> : null}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 items-center rounded-xl border border-line">
                <button
                  type="button"
                  aria-label="کاهش تعداد"
                  disabled={busyId === item.id}
                  onClick={() => run(item.id, () => update(item.id, Math.max(1, item.quantity - 1)))}
                  className="h-11 w-11 disabled:opacity-40"
                ><Minus className="mx-auto h-4 w-4" /></button>
                <span className="w-8 text-center text-sm">{formatNumber(item.quantity)}</span>
                <button
                  type="button"
                  aria-label="افزایش تعداد"
                  disabled={busyId === item.id || item.quantity >= item.stock}
                  onClick={() => run(item.id, () => update(item.id, Math.min(item.stock, item.quantity + 1)))}
                  className="h-11 w-11 disabled:opacity-40"
                ><Plus className="mx-auto h-4 w-4" /></button>
              </div>
              <button
                type="button"
                aria-label="حذف آیتم"
                disabled={busyId === item.id}
                onClick={() => run(item.id, () => remove(item.id))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-red-600 hover:border-red-300 disabled:opacity-40"
              ><Trash2 className="h-4 w-4" /></button>
            </div>
          </Card>
        ))}
        {(localError || error) ? <Alert tone="error">{localError ?? error}</Alert> : null}
      </div>

      <Card className="h-fit p-6">
        <h2 className="mb-5 text-lg font-semibold">خلاصه سفارش</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">جمع کالاها ({formatNumber(view.itemCount)})</dt>
            <dd dir="ltr">{formatToman(view.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">هزینه ارسال (پست)</dt>
            <dd dir="ltr">{shipping === 0 ? "رایگان" : formatToman(shipping)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-4 text-base font-semibold">
            <dt>مبلغ نهایی</dt>
            <dd dir="ltr" className="text-primary">{formatToman(total)}</dd>
          </div>
        </dl>
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] text-ink/40">
            <span>پیشرفت ارسال رایگان</span>
            <span>{Math.min(100, progress)}٪</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/70">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {remaining > 0 ? (
          <p className="mt-4 rounded-xl bg-secondary/10 p-3 text-xs text-ink/65">
            با خرید {formatToman(remaining)} بیشتر، ارسال رایگان شوید.
          </p>
        ) : (
          <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800">ارسال سفارش شما رایگان است.</p>
        )}
        {hasUnavailable ? (
          <div className="mt-6"><Alert tone="error">برای ادامه، ابتدا تعداد یا محصولات ناموجود را اصلاح کنید.</Alert></div>
        ) : (
          <ButtonLink href="/checkout" size="lg" className="mt-6 w-full">ادامه به پرداخت</ButtonLink>
        )}
      </Card>
    </div>
  );
}
