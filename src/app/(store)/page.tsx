import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getHomeData } from "@/services/catalog";
import { getSiteConfig } from "@/config/site";
import { ProductGrid } from "@/components/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/display";
import { formatNumber, formatJalali } from "@/lib/persian";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ featured, arrivals, bestSellers, categories }, site] = await Promise.all([
    getHomeData(),
    getSiteConfig(),
  ]);

  return (
    <>
      <section className="container-luxury pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-luxury border border-line bg-surface">
          <div className="grid items-center gap-8 p-8 sm:p-14 lg:grid-cols-2 lg:p-20">
            <div className="max-w-xl space-y-6">
              <span className="inline-flex rounded-full bg-secondary/20 px-4 py-2 text-xs font-medium text-primary">
                مجموعه پاییز و زمستان {formatNumber(new Date().getFullYear())}
              </span>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                استایلی که <span className="text-primary">متعلق به شماست</span>
              </h1>
              <p className="max-w-md text-base leading-8 text-ink/65">{site.tagline}</p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/shop" size="lg">مشاهده مجموعه</ButtonLink>
                <ButtonLink href="/shop?newArrival=true" size="lg" variant="outline">جدیدترینها</ButtonLink>
              </div>
              <p className="text-xs text-ink/50">ارسال رایگان سفارشهای بالای ۱٫۵ میلیون تومان</p>
            </div>
            <div className="relative hidden h-[420px] overflow-hidden rounded-luxury bg-line/40 lg:block">
              {featured[0]?.image ? (
                <Image
                  src={featured[0].image}
                  alt={featured[0].name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 0px, 45vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-6xl text-primary/20">
                  {site.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-label="اظهارات اعتماد" className="container-luxury mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Truck, title: "ارسال سراسر کشور", text: "پست و پیک با پیگیری" },
          { icon: ShieldCheck, title: "پرداخت امن", text: "تأیید server-side" },
          { icon: RotateCcw, title: "بازگشت ۷ روزه", text: "طبق شرایط درجشده" },
          { icon: PackageCheck, title: "بستهبندی دقیق", text: "بررسی قبل از ارسال" },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/70 px-4 py-4">
            <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-ink/55">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="container-luxury mt-20">
        <SectionTitle title="دستهبندیها" subtitle="مسیرتان را برای پیدا کردن استایل مورد نظر کوتاه کنید" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="surface-card group flex min-h-40 flex-col justify-between p-5 transition-transform hover:-translate-y-1"
            >
              <span className="text-sm font-semibold">{category.name}</span>
              <span className="text-xs text-ink/50">
                {formatNumber(category._count.products)} محصول
              </span>
              <ArrowLeft className="h-5 w-5 text-primary transition-transform group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <section className="container-luxury mt-20">
        <SectionTitle title="انتخاب ویژه" subtitle="محصولاتی که بیشتر پسندیدهاند" href="/shop?featured=true" linkLabel="همه محصولات" />
        <ProductGrid products={featured} />
      </section>

      <section className="container-luxury mt-20">
        <div className="relative overflow-hidden rounded-luxury bg-primary px-8 py-12 text-white sm:px-14 sm:py-16">
          <div className="relative z-10 max-w-xl space-y-4">
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">New Season</p>
            <h2 className="text-3xl font-semibold sm:text-4xl">تازگیهایی که ارزش دیدن دارند</h2>
            <p className="text-sm leading-7 text-white/80">مجموعهای از تازهترین طراحیها، با جزئیات دقیق و پارچههای منتخب.</p>
            <Link href="/shop?newArrival=true" className="inline-flex min-h-12 items-center rounded-2xl bg-white px-6 text-sm font-semibold text-primary hover:bg-white/90">
              مشاهده جدیدها
            </Link>
          </div>
          <div aria-hidden className="absolute -left-10 -top-16 h-72 w-72 rounded-full border-40 border-white/5" />
        </div>
      </section>

      <section className="container-luxury mt-20">
        <SectionTitle title="تازه رسیدهها" subtitle="اولین کسانی باشید که آنها را میبینید" href="/shop?newArrival=true" linkLabel="مشاهده همه" />
        <ProductGrid products={arrivals} />
      </section>

      <section className="container-luxury mt-20">
        <SectionTitle title="پرفروشها" subtitle="محبوبترینها میان مشتریان" href="/shop?sort=popular" linkLabel="مشاهده همه" />
        <ProductGrid products={bestSellers} />
      </section>

      <section className="container-luxury mt-20">
        <div className="surface-card flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <h2 className="text-2xl font-semibold">سفارش خود را پیگیری کنید</h2>
            <p className="mt-2 text-sm text-ink/60">
              امروز {formatJalali(new Date())} — سفارشها در روزهای کاری پردازش میشوند.
            </p>
          </div>
          <ButtonLink href="/track" variant="outline" size="lg">پیگیری سفارش</ButtonLink>
        </div>
      </section>
    </>
  );
}
