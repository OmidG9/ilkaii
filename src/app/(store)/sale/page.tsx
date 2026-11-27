import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BadgePercent, Clock3, RotateCcw, ShieldCheck } from "lucide-react";
import { getSaleOverview } from "@/services/catalog";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import { SaleCountdown } from "@/components/sale-countdown";
import { Marquee, themeBackground } from "@/components/editorial";
import { formatNumber } from "@/lib/persian";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "حراج فصل",
  description: "قطعه‌های منتخب ilkaii با تخفیف محدود؛ تا پایان فصل یا اتمام موجودی.",
  alternates: { canonical: "/sale" },
};

const saleTheme = { from: "#211C18", to: "#4A3B31", accent: "#E7D8C8", ink: "light" as const };

export default async function SalePage() {
  const sale = await getSaleOverview(24);

  return (
    <div className="pb-24">
      <section className="container-luxury pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-[36px]" style={themeBackground(saleTheme)}>
          <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 14px)" }} />
          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:p-16">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.35em] text-white/50">
                <BadgePercent className="h-3.5 w-3.5" /> FINAL EDIT / ۱۴۰۴
              </p>
              <h1 className="mt-6 text-balance text-5xl font-semibold leading-[0.95] text-white sm:text-7xl lg:text-8xl">
                حراج
                <br />
                <span className="font-display italic text-white/45">فصل</span>
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-8 text-white/60">
                قطعه‌هایی که در پایان فصل باقی مانده‌اند، با قیمتی صادقانه. موجودی محدود است و بعد از پایان، مجموعهٔ بعدی جایگزین می‌شود. بدون شمارش معکوس مصنوعی؛ این تاریخ واقعی پایان حراج است.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#deals" size="lg" className="bg-white text-ink hover:bg-white/90">دیدن تخفیف‌ها</ButtonLink>
                <ButtonLink href="/new-arrivals" size="lg" variant="outline" className="border-white/30 text-white hover:bg-white hover:text-ink">به‌جای آن، تازه‌ها</ButtonLink>
              </div>

              <div className="mt-10 border-t border-white/10 pt-6">
                <p className="mb-3 flex items-center gap-2 text-[10px] tracking-[0.28em] text-white/40"><Clock3 className="h-3.5 w-3.5" /> ENDS IN</p>
                <SaleCountdown />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-4xl font-semibold text-white sm:text-5xl">{formatNumber(sale.count)}</p>
                <p className="mt-2 text-xs text-white/45">قطعهٔ تخفیف‌دار</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-4xl font-semibold text-white sm:text-5xl">{formatNumber(sale.bestDiscount)}٪</p>
                <p className="mt-2 text-xs text-white/45">بیشترین تخفیف</p>
              </div>
              <div className="col-span-2 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-white/45">میانگین تخفیف</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{formatNumber(sale.averageDiscount)}٪</p>
                  </div>
                  <div className="h-16 w-28 rounded-2xl bg-gradient-to-l from-white/20 to-white/5" aria-hidden />
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#D9C5B2]" style={{ width: `${Math.min(100, sale.averageDiscount * 2)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        className="mt-8"
        invert
        items={["SALE — FINAL EDIT", "تا پایان موجودی", "UP TO " + formatNumber(sale.bestDiscount) + "% OFF", "قطعه‌های محدود", "NO RESTOCK"]}
      />

      <section id="deals" className="container-luxury mt-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-6">
          <div>
            <p className="eyebrow">THE DEALS</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">قطعه‌های باقی‌مانده</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-ink/50">
            <span className="rounded-full border border-line bg-surface px-3 py-1.5">مرتب‌شده: جدیدترین</span>
            <Link href="/shop?sort=price-asc" className="rounded-full border border-line bg-surface px-3 py-1.5 hover:border-primary hover:text-primary">همهٔ محصولات</Link>
          </div>
        </div>

        {sale.products.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {sale.products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
          </div>
        ) : (
          <EmptyState
            title="در حال حاضر تخفیف فعالی وجود ندارد"
            description="مجموعهٔ تازه در راه است. می‌توانید تازه‌ها را ببینید یا در خبرنامه عضو شوید."
            action={<ButtonLink href="/new-arrivals" className="mt-2">دیدن تازه‌ها</ButtonLink>}
          />
        )}
      </section>

      <section className="container-luxury mt-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "تخفیف واقعی", text: "قیمت خط‌خورده، قیمت پیش از تخفیف است؛ نه قیمت ساختگی." },
            { icon: RotateCcw, title: "بازگشت ۷ روزه", text: "قطعه‌های حراج هم طبق شرایط بازگشت، قابل مرجوعی هستند." },
            { icon: Clock3, title: "بدون شارژ مجدد", text: "بعد از اتمام موجودی، این قطعه‌ها دوباره تولید نمی‌شوند." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-3xl border border-line bg-surface p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-xs leading-6 text-ink/55">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-luxury mt-20">
        <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">BEFORE YOU GO</p>
            <h2 className="mt-3 text-2xl font-semibold">کد تخفیف دارید؟</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-ink/55">کد را در مرحلهٔ تسویه حساب وارد کنید. کدهای تخفیف با قیمت حراج قابل ترکیب نیستند، مگر در شرایط اعلام‌شده.</p>
          </div>
          <ButtonLink href="/shop" variant="outline">بازگشت به فروشگاه</ButtonLink>
        </div>
      </section>

      <p className="container-luxury mt-10 text-center text-xs text-ink/35">
        <Link href="/policies/returns" className="inline-flex items-center gap-1 hover:text-primary">شرایط بازگشت کالاهای حراج <ArrowLeft className="h-3 w-3" /></Link>
      </p>
    </div>
  );
}
