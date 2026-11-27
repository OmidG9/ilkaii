import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { collections } from "@/config/editorial";
import { getCollectionPage } from "@/services/storefront";
import { ProductGrid } from "@/components/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";
import { EditorialHero, EditorialSectionTitle, EditorialImageFrame, Marquee, Stat, themeBackground } from "@/components/editorial";
import { formatNumber } from "@/lib/persian";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = collections.find((item) => item.slug === slug);
  if (!collection) return { title: "کالکشن یافت نشد", robots: { index: false } };
  return {
    title: `کالکشن ${collection.title}`,
    description: collection.description,
    alternates: { canonical: `/collections/${collection.slug}` },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const page = await getCollectionPage(slug);
  if (!page) notFound();

  const { collection, category, products, total } = page;
  const image = products[0]?.image ?? null;
  const index = collections.findIndex((item) => item.slug === collection.slug);
  const previous = collections[(index - 1 + collections.length) % collections.length]!;
  const next = collections[(index + 1) % collections.length]!;

  return (
    <div className="pb-24">
      <div className="container-luxury pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 text-[11px] text-ink/45">
          <Link href="/collections" className="inline-flex items-center gap-2 hover:text-primary">
            <ArrowRight className="h-3.5 w-3.5" /> همهٔ کالکشن‌ها
          </Link>
          <span className="tracking-[0.25em]">{collection.index} / {collection.season}</span>
        </div>
      </div>

      <EditorialHero
        eyebrow={`${collection.englishTitle.toUpperCase()} — ${collection.season}`}
        title={
          <>
            {collection.title}
            <span className="mt-4 block font-display text-xl italic opacity-50 sm:text-3xl">{collection.englishTitle}</span>
          </>
        }
        description={collection.description}
        theme={collection.theme}
        size="grand"
        aside={
          <div className="relative mx-auto max-w-sm">
            <span aria-hidden className="absolute -right-6 -top-14 font-display text-[150px] leading-none opacity-10">{collection.index}</span>
            <EditorialImageFrame
              src={image}
              alt={products[0]?.name ?? collection.title}
              theme={collection.theme}
              className="aspect-[3/4] rotate-[1.5deg] shadow-2xl"
              sizes="(max-width: 1024px) 80vw, 32vw"
              priority
            />
            <div className="absolute -bottom-5 -left-4 rounded-2xl border border-current/20 bg-white/80 px-5 py-4 text-ink shadow-soft backdrop-blur">
              <p className="text-[9px] tracking-[0.25em] text-primary/50">PIECES</p>
              <p className="mt-1 text-2xl font-semibold">{formatNumber(total)}</p>
            </div>
          </div>
        }
      >
        <ButtonLink href={category ? `/category/${category.slug}` : "/shop"} size="lg" className="bg-ink text-canvas hover:bg-ink/85">
          خرید کالکشن
        </ButtonLink>
        <ButtonLink href="/size-guide" size="lg" variant="outline" className="border-current text-current hover:bg-current/10">
          راهنمای سایز
        </ButtonLink>
      </EditorialHero>

      <Marquee className="mt-8" items={[collection.englishTitle, collection.quote, `${formatNumber(total)} PIECES`, collection.season, "MADE TO BE WORN"]} />

      <section className="container-luxury mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">THE IDEA</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold">{collection.subtitle}</h2>
          <div className="mt-6 space-y-4 text-sm leading-8 text-ink/60">
            <p>{collection.description}</p>
            <p>
              قطعه‌ها به‌صورت جداگانه قابل خرید هستند و با هم چند استایل کامل می‌سازند. اگر بین دو سایز هستید، راهنمای سایز یا مشاورهٔ ما کمک می‌کند انتخاب دقیق‌تری داشته باشید.
            </p>
          </div>
          <blockquote className="mt-8 border-r-2 border-primary/40 pr-5">
            <Quote className="mb-2 h-5 w-5 text-primary/40" />
            <p className="font-display text-xl italic leading-9 text-ink/70">{collection.quote}</p>
          </blockquote>
          <div className="mt-8 flex flex-wrap gap-2">
            {collection.features.map((feature) => (
              <span key={feature} className="rounded-full border border-line bg-surface px-4 py-2 text-[11px] text-ink/55">{feature}</span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "فصل", value: collection.season },
            { label: "دستهٔ اصلی", value: category?.name ?? "در حال تکمیل" },
            { label: "تعداد قطعه", value: `${formatNumber(total)} قطعه` },
            { label: "رویکرد", value: "تولید محدود" },
          ].map((item, itemIndex) => (
            <div key={item.label} className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6">
              <span aria-hidden className="absolute left-4 top-2 font-display text-5xl text-primary/10">{["۰۱", "۰۲", "۰۳", "۰۴"][itemIndex]}</span>
              <p className="text-[10px] tracking-[0.24em] text-ink/40">{item.label}</p>
              <p className="mt-3 text-sm font-semibold">{item.value}</p>
            </div>
          ))}
          <div className="rounded-3xl p-6 sm:col-span-2" style={themeBackground(collection.theme)}>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-[10px] tracking-[0.24em] opacity-55">STYLE NOTES</p>
                <p className="mt-2 max-w-md text-sm leading-7 opacity-75">این کالکشن با رنگ‌های خنثی و قطعه‌های موجود در کمد شما ترکیب می‌شود. کمتر بخرید، بیشتر بپوشید.</p>
              </div>
              <Stat value={formatNumber(products.length)} label="قطعه در این صفحه" light={collection.theme.ink === "light"} />
            </div>
          </div>
        </div>
      </section>

      <section className="container-luxury mt-20">
        <EditorialSectionTitle
          index="THE PIECES"
          title={`قطعه‌های ${collection.title}`}
          subtitle="همهٔ محصولات این کالکشن، با امکان فیلتر دقیق‌تر در صفحهٔ دسته‌بندی."
          href={category ? `/category/${category.slug}` : "/shop"}
          linkLabel="مشاهده در فروشگاه"
        />

        {products.length ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            title="این کالکشن در حال تکمیل است"
            description="قطعه‌های این مجموعه به‌زودی اضافه می‌شوند. در این فاصله، تازه‌ها را ببینید."
            action={<ButtonLink href="/new-arrivals" className="mt-2">دیدن تازه‌ها</ButtonLink>}
          />
        )}
      </section>

      <section className="container-luxury mt-24">
        <div className="grid gap-4 border-t border-line pt-8 sm:grid-cols-2">
          <Link href={`/collections/${previous.slug}`} className="group flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-surface">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line"><ArrowRight className="h-4 w-4" /></span>
            <span>
              <span className="block text-[10px] tracking-[0.24em] text-ink/40">PREVIOUS</span>
              <span className="mt-1 block text-sm font-semibold group-hover:text-primary">{previous.title}</span>
            </span>
          </Link>
          <Link href={`/collections/${next.slug}`} className="group flex items-center justify-end gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-surface">
            <span>
              <span className="block text-[10px] tracking-[0.24em] text-ink/40">NEXT</span>
              <span className="mt-1 block text-sm font-semibold group-hover:text-primary">{next.title}</span>
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line"><ArrowLeft className="h-4 w-4" /></span>
          </Link>
        </div>
      </section>
    </div>
  );
}
