import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, PackageCheck, Quote, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getHomeData } from "@/services/catalog";
import { getActiveBanners, getActiveHomepageSections, listPublishedPosts } from "@/services/cms";
import { getSiteConfig } from "@/config/site";
import { collectionForCategory } from "@/config/editorial";
import { ProductGrid } from "@/components/product-grid";
import { HomepageSections } from "@/components/homepage-sections";
import { ButtonLink } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/display";
import { EditorialImageFrame, Marquee, themeBackground } from "@/components/editorial";
import { formatNumber, formatJalali } from "@/lib/persian";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

function BannerStrip({ banners }: { banners: Array<{ id: string; title: string; image: string; href: string | null }> }) {
  if (!banners.length) return null;
  const safeHref = (value: string | null) => value && (value.startsWith("/") || /^https?:\/\//i.test(value)) ? value : "/shop";
  return (
    <section className="container-luxury mt-10 grid gap-4 sm:grid-cols-2">
      {banners.map((banner) => (
        <Link key={banner.id} href={safeHref(banner.href)} className="group relative block overflow-hidden rounded-luxury border border-line">
          {/* Operator-supplied banner hosts are configurable; avoid build-time host validation. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.image} alt={banner.title} loading="lazy" className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 text-sm font-semibold text-white">{banner.title}</span>
        </Link>
      ))}
    </section>
  );
}

export default async function HomePage() {
  const [{ featured, arrivals, bestSellers, categories }, site, sections, banners, posts] = await Promise.all([
    getHomeData(),
    getSiteConfig(),
    getActiveHomepageSections(),
    getActiveBanners("HOME"),
    listPublishedPosts().catch(() => []),
  ]);

  if (sections.length) {
    return (
      <>
        <HomepageSections
          sections={sections.map((section) => ({
            id: section.id, type: section.type, title: section.title,
            subtitle: section.subtitle, parsedConfig: section.parsedConfig as Record<string, unknown>,
          }))}
          featured={featured}
          arrivals={arrivals}
          bestSellers={bestSellers}
          categories={categories}
        />
        <BannerStrip banners={banners.map((banner) => ({ id: banner.id, title: banner.title, image: banner.image, href: banner.href }))} />
      </>
    );
  }

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
              <p className="text-xs text-ink/50">ارسال رایگان سفارش‌های بالای {formatToman(site.shipping.freeThreshold)}</p>
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

      <BannerStrip banners={banners.map((banner) => ({ id: banner.id, title: banner.title, image: banner.image, href: banner.href }))} />

      <Marquee
        className="mt-8"
        items={["ILKAII / SEASON ۱۴۰۴", "DESIGNED IN IRAN", "SMALL BATCH", "کمتر بخرید، بهتر بپوشید", "MADE TO BE WORN"]}
      />

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
          {categories.map((category) => {
            const collection = collectionForCategory(category.slug);
            if (!collection) {
              return (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="surface-card group flex min-h-40 flex-col justify-between p-5 transition-transform hover:-translate-y-1"
                >
                  <span className="text-sm font-semibold">{category.name}</span>
                  <span className="text-xs text-ink/50">{formatNumber(category._count.products)} محصول</span>
                  <ArrowLeft className="h-5 w-5 text-primary transition-transform group-hover:-translate-x-1" />
                </Link>
              );
            }
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group relative flex min-h-44 flex-col justify-between overflow-hidden rounded-2xl p-5 transition-transform hover:-translate-y-1"
                style={themeBackground(collection.theme)}
              >
                <span aria-hidden className="pointer-events-none absolute -bottom-4 left-1 font-display text-7xl leading-none opacity-10">{collection.index}</span>
                <span className="relative flex items-start justify-between gap-2">
                  <span className="text-[9px] tracking-[0.2em] opacity-50">{collection.englishTitle.toUpperCase()}</span>
                  <ArrowLeft className="h-4 w-4 opacity-50 transition-transform group-hover:-translate-x-1" />
                </span>
                <span className="relative">
                  <span className="block text-sm font-semibold">{category.name}</span>
                  <span className="mt-1 block text-[10px] opacity-55">{formatNumber(category._count.products)} محصول</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-luxury mt-20">
        <div className="grid overflow-hidden rounded-[36px] border border-line bg-surface lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[380px] lg:min-h-[460px]">
            <EditorialImageFrame
              src={arrivals[1]?.image ?? featured[0]?.image}
              alt={arrivals[1]?.name ?? "لوک‌بوک ilkaii"}
              theme={{ from: "#DFD2C4", to: "#9C8370", accent: "#4A382C", ink: "dark" }}
              className="absolute inset-0 h-full w-full rounded-none border-0"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute bottom-6 right-6 left-6 rounded-2xl border border-white/20 bg-black/25 p-5 text-white backdrop-blur">
              <Quote className="h-4 w-4 text-white/50" />
              <p className="mt-2 font-display text-lg italic leading-8 sm:text-xl">استایل واقعی، در موقعیت‌های واقعی.</p>
              <p className="mt-1 text-[10px] text-white/50">لوک‌بوک پاییز و زمستان ۱۴۰۴</p>
            </div>
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <p className="eyebrow">THE LOOKBOOK / ۰۴</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">چهار قاب از یک روز واقعی</h2>
            <p className="mt-4 max-w-lg text-sm leading-8 text-ink/55">
              صبح آرام، گذر از شهر، تمرین آزادی و شبِ جین. لوک‌بوک جدید، لباس‌ها را در زندگی روزمره نشان می‌دهد؛ نه روی سن.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["صبح آرام", "لایه‌های شهری", "در حرکت", "جین و شب"].map((chapter) => (
                <span key={chapter} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-[10px] text-ink/50">{chapter}</span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/lookbook">ورق بزنید</ButtonLink>
              <ButtonLink href="/new-arrivals" variant="outline">خرید از لوک‌بوک</ButtonLink>
            </div>
          </div>
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

      {posts.length ? (
        <section className="container-luxury mt-20">
          <SectionTitle title="از ژورنال" subtitle="دربارهٔ پارچه، فرم و انتخاب‌های آگاهانه" href="/blog" linkLabel="همهٔ مقاله‌ها" />
          <div className="grid gap-5 sm:grid-cols-3">
            {posts.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-luxury border border-line bg-surface">
                <div
                  role="img"
                  aria-label={post.title}
                  className="aspect-[16/10] w-full bg-gradient-to-br from-primary/20 to-secondary/35 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
                  style={post.coverImage ? { backgroundImage: `url(${post.coverImage})` } : undefined}
                />
                <div className="p-5">
                  <p className="text-[10px] text-ink/40">{post.publishedAt ? formatJalali(post.publishedAt) : ""} — {post.readingMinutes} دقیقه</p>
                  <h3 className="mt-2 line-clamp-2 text-base font-semibold group-hover:text-primary">{post.title}</h3>
                  {post.excerpt ? <p className="mt-2 line-clamp-2 text-xs leading-6 text-ink/50">{post.excerpt}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-luxury mt-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { href: "/size-guide", title: "سایز درست را پیدا کنید", text: "جدول اندازه و راهنمای انتخاب" },
            { href: "/policies/shipping", title: "ارسال و تحویل", text: "زمان، هزینه و پیگیری مرسوله" },
            { href: "/policies/returns", title: "بازگشت آسان", text: "۷ روز فرصت، شرایط روشن" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-primary">
              <p className="text-sm font-semibold group-hover:text-primary">{item.title}</p>
              <p className="mt-1 text-xs text-ink/45">{item.text}</p>
              <ArrowLeft className="mt-4 h-4 w-4 text-primary/50 transition-transform group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
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
