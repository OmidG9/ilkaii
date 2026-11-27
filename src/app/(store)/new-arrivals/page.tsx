import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getNewArrivals, getEditorialPicks } from "@/services/storefront";
import { getSiteConfig } from "@/config/site";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import { EditorialImageFrame, EditorialSectionTitle, Marquee } from "@/components/editorial";
import { formatNumber } from "@/lib/persian";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تازه‌ها",
  description: "جدیدترین قطعه‌های ilkaii؛ مجموعهٔ محدود فصل با طراحی مینیمال و پارچه‌های منتخب.",
  alternates: { canonical: "/new-arrivals" },
};

const dropTheme = { from: "#F1E9DE", to: "#D8C6B4", accent: "#5B4737", ink: "dark" as const };

export default async function NewArrivalsPage() {
  const [{ products, total, categories }, picks, site] = await Promise.all([
    getNewArrivals(16),
    getEditorialPicks(2),
    getSiteConfig(),
  ]);
  const cover = products[0] ?? picks[0];
  const second = products[1] ?? picks[1];

  return (
    <div className="pb-24">
      <section className="container-luxury pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface">
          <div className="grain absolute inset-0 opacity-60" aria-hidden />
          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-16">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-[10px] font-semibold tracking-[0.22em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> DROP ۰۴ / NEW
                </span>
                <span className="text-xs text-ink/45">به‌روزرسانی هفتگی</span>
              </div>
              <h1 className="relative mt-7 text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl lg:text-8xl">
                <span className="font-display italic text-primary/30">N</span>ew
                <br />
                تازه رسیده‌ها
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-8 text-ink/60">
                هر هفته، چند قطعهٔ محدود به کمد اضافه می‌شود. بدون تولید انبوه، بدون تکرار. این‌ها تازه‌ترین‌ها هستند؛ بعضی‌ها فقط چند عدد موجودی دارند.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#grid" size="lg">دیدن قطعه‌ها</ButtonLink>
                <ButtonLink href="/lookbook" size="lg" variant="outline">لوک‌بوک فصل</ButtonLink>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-ink/45">
                <span><strong className="text-base font-semibold text-ink">{formatNumber(total)}</strong> قطعهٔ تازه</span>
                <span><strong className="text-base font-semibold text-ink">{formatNumber(categories.length)}</strong> دسته‌بندی</span>
                <span><strong className="text-base font-semibold text-ink">۷</strong> روز فرصت بازگشت</span>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-md items-end justify-center">
              <EditorialImageFrame
                src={cover?.image}
                alt={cover?.name ?? "تازه‌های ilkaii"}
                theme={dropTheme}
                className="aspect-[3/4] w-[72%] translate-y-3 rotate-[-2deg] shadow-xl"
                sizes="(max-width: 1024px) 80vw, 30vw"
                priority
              />
              <EditorialImageFrame
                src={second?.image}
                alt={second?.name ?? "قطعهٔ تازه"}
                theme={{ from: "#D8C6B4", to: "#8A6F5C", accent: "#4A382C", ink: "light" }}
                className="absolute bottom-0 left-0 aspect-[3/4] w-[44%] rotate-[3deg] shadow-xl"
                sizes="(max-width: 1024px) 45vw, 18vw"
              />
              <span className="absolute -right-2 top-6 z-10 flex h-20 w-20 rotate-12 items-center justify-center rounded-full bg-primary text-center text-[10px] font-semibold leading-4 text-white shadow-soft">
                LIMITED<br />EDIT
              </span>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        className="mt-8"
        items={["NEW IN THIS WEEK", "SMALL BATCH PRODUCTION", "اولین نفر باشید", "FRESH FROM THE STUDIO", "تازه‌ها، محدود"]}
      />

      <section id="grid" className="container-luxury mt-16">
        <EditorialSectionTitle
          index="JUST LANDED"
          title="همین حالا، همین‌جا"
          subtitle="مرتب‌شده از جدیدترین. اگر سایز شما موجود نیست، می‌توانید از صفحهٔ محصول درخواست اطلاع‌رسانی ثبت کنید."
          href="/shop?sort=newest"
          linkLabel="همهٔ محصولات"
        />

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?newArrival=true&category=${category.slug}`}
              className="inline-flex min-h-10 items-center rounded-full border border-line bg-surface px-4 text-xs text-ink/65 transition-colors hover:border-primary hover:text-primary"
            >
              {category.name}
              <span className="mr-2 text-[10px] text-ink/35">{formatNumber(category._count.products)}</span>
            </Link>
          ))}
          <Link href="/new-arrivals" className="inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-xs text-white">
            همه
          </Link>
        </div>

        {products.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
              <div key={product.id} className={index === 0 ? "sm:col-span-2 sm:row-span-1" : ""}>
                <ProductCard product={product} priority={index < 4} />
                {index === 0 ? (
                  <div className="mt-4 hidden items-center gap-3 border-t border-line pt-4 text-xs text-ink/45 sm:flex">
                    <span className="font-display text-2xl text-primary/40">۰۱</span>
                    قطعهٔ شاخص این هفته — {site.name}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="هنوز قطعهٔ تازه‌ای ثبت نشده" description="به‌زودی مجموعهٔ بعدی منتشر می‌شود. در این فاصله، فروشگاه را ببینید." action={<ButtonLink href="/shop" className="mt-2">مشاهدهٔ فروشگاه</ButtonLink>} />
        )}
      </section>

      <section className="container-luxury mt-24">
        <div className="grid gap-8 rounded-[32px] border border-line bg-surface p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">DROP CALENDAR</p>
            <h2 className="mt-4 text-balance text-2xl font-semibold sm:text-3xl">هر هفته یک قطعه، هر ماه یک مجموعه</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/55">
              به‌جای حراج‌های پرسروصدا، ریتم آرام تولید را انتخاب کرده‌ایم. برای اطلاع از انتشار مجموعهٔ بعدی، خبرنامه را دنبال کنید یا صفحهٔ تازه‌ها را نشان کنید.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/collections">کالکشن‌ها</ButtonLink>
            <ButtonLink href="/contact" variant="outline">پرسش دربارهٔ موجودی</ButtonLink>
          </div>
        </div>
      </section>

      <Marquee
        className="mt-24"
        invert
        items={["تولید محدود", "طراحی در ایران", "ارسال سراسر کشور", "۷ روز فرصت بازگشت", "پارچه‌های منتخب"]}
      />

      <p className="container-luxury mt-10 text-center text-xs text-ink/35">
        <Link href="/shop" className="inline-flex items-center gap-1 hover:text-primary">همهٔ محصولات <ArrowLeft className="h-3 w-3" /></Link>
      </p>
    </div>
  );
}
