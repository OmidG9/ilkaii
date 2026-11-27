import Link from "next/link";
import { ArrowLeft, Compass, Home, Search, Sparkles } from "lucide-react";
import { collections } from "@/config/editorial";
import { ButtonLink } from "@/components/ui/button";

export default function StoreNotFound() {
  return (
    <div className="container-luxury py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface">
        <div aria-hidden className="grain absolute inset-0 opacity-60" />
        <div className="relative grid gap-12 p-8 sm:p-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-20">
          <div>
            <p className="eyebrow">LOST BETWEEN THE RAILS / 404</p>
            <p className="mt-4 font-display text-[110px] font-semibold leading-none tracking-tight text-primary/15 sm:text-[180px]">404</p>
            <h1 className="mt-2 text-balance text-3xl font-semibold sm:text-5xl">
              این قاب، در لوک‌بوک ما نیست.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-8 text-ink/55">
              شاید آدرس تغییر کرده باشد، محصول از مجموعه خارج شده یا لینک ناقص باشد. نگران نباشید؛ مسیرهای خوبی همین نزدیکی هست.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/" size="lg"><Home className="h-4 w-4" /> خانه</ButtonLink>
              <ButtonLink href="/shop" size="lg" variant="outline"><Search className="h-4 w-4" /> فروشگاه</ButtonLink>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-canvas p-6 sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold"><Compass className="h-4 w-4 text-primary" /> شاید دنبال این‌ها بودید</p>
            <div className="mt-5 space-y-1">
              {[
                { href: "/new-arrivals", label: "تازه‌ترین قطعه‌ها", note: "NEW" },
                { href: "/collections", label: "کالکشن‌های فصلی", note: "COLLECTIONS" },
                { href: "/lookbook", label: "لوک‌بوک فصل", note: "LOOKBOOK" },
                { href: "/sale", label: "حراج فصل", note: "SALE" },
                { href: "/size-guide", label: "راهنمای سایز", note: "GUIDE" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="group flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0">
                  <span className="text-sm text-ink/70 transition-colors group-hover:text-primary">{item.label}</span>
                  <span className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-ink/30 transition-colors group-hover:text-primary/60">
                    {item.note} <ArrowLeft className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-ink/40">
        <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> پیشنهاد: از تازه‌ها شروع کنید</span>
        {collections.slice(0, 3).map((collection) => (
          <Link key={collection.slug} href={`/collections/${collection.slug}`} className="hover:text-primary">{collection.title}</Link>
        ))}
      </div>
    </div>
  );
}
