"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw, ShoppingBag, Wrench } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("storefront_error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="container-luxury py-16 sm:py-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[36px] border border-line bg-surface">
        <div aria-hidden className="grain absolute inset-0 opacity-50" />
        <div className="relative grid gap-10 p-8 sm:p-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative flex min-h-[220px] items-center justify-center rounded-[28px] bg-primary/5">
            <span aria-hidden className="absolute font-display text-[150px] leading-none text-primary/10">!</span>
            <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-surface text-primary shadow-soft">
              <AlertTriangle className="h-8 w-8" />
            </span>
          </div>
          <div>
            <p className="eyebrow">SOMETHING TORE / ERROR</p>
            <h1 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">این صفحه موقتاً در دسترس نیست.</h1>
            <p className="mt-4 text-sm leading-8 text-ink/55">
              مشکلی در بارگذاری بخشی از صفحه پیش آمده است. اطلاعات شما در امان است. می‌توانید دوباره تلاش کنید یا از مسیر دیگری ادامه دهید.
            </p>
            {error.digest ? (
              <p dir="ltr" className="mt-4 inline-flex rounded-lg border border-line bg-canvas px-3 py-1.5 text-[10px] text-ink/35">Ref: {error.digest}</p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button type="button" onClick={reset} size="lg"><RefreshCw className="h-4 w-4" /> تلاش دوباره</Button>
              <ButtonLink href="/" size="lg" variant="outline"><Home className="h-4 w-4" /> خانه</ButtonLink>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-ink/40">
              <Link href="/shop" className="inline-flex items-center gap-1.5 hover:text-primary"><ShoppingBag className="h-3.5 w-3.5" /> فروشگاه</Link>
              <Link href="/contact" className="inline-flex items-center gap-1.5 hover:text-primary"><Wrench className="h-3.5 w-3.5" /> گزارش به پشتیبانی</Link>
            </div>
            <p className="mt-6 text-[11px] leading-6 text-ink/35">
              اگر خطا ادامه دارد: اتصال اینترنت را بررسی کنید و چند لحظه بعد دوباره تلاش کنید. گروه فنی از طریق گزارش خطا مطلع می‌شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
