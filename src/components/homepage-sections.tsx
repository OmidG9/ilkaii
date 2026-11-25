import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import type { ProductCard } from "@/services/catalog";
import { listProductsByIds } from "@/services/catalog";
import { ProductGrid } from "@/components/product-grid";
import { SectionTitle } from "@/components/ui/display";
import { formatNumber } from "@/lib/persian";

interface SectionConfig {
  [key: string]: unknown;
}

export interface HomepageSectionData {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  parsedConfig: SectionConfig;
}

interface Props {
  sections: HomepageSectionData[];
  featured: ProductCard[];
  arrivals: ProductCard[];
  bestSellers: ProductCard[];
  categories: Array<{ id: string; name: string; slug: string; _count: { products: number } }>;
}

const text = (value: unknown) => typeof value === "string" ? value : "";
const numberValue = (value: unknown, fallback: number) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
const href = (value: unknown, fallback: string) => {
  const candidate = text(value);
  return candidate.startsWith("/") || /^https?:\/\//i.test(candidate) ? candidate : fallback;
};

function Cta({ label, to }: { label: string; to: string }) {
  if (!label) return null;
  return <Link href={to} className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-sm font-semibold text-white hover:bg-hover">{label}</Link>;
}

function SectionHeading({ title, subtitle, ctaLabel, ctaHref }: { title?: string | null; subtitle?: string | null; ctaLabel?: string; ctaHref?: string }) {
  return <SectionTitle title={title ?? ""} subtitle={subtitle ?? undefined} href={ctaHref} linkLabel={ctaLabel} />;
}

function ManagedImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  if (!src) return <div className={`${className} flex items-center justify-center bg-line/40 text-sm text-ink/30`}>بدون تصویر</div>;
  // CMS images may live on operator-configured hosts; plain img avoids a build-time host allowlist.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={className} />;
}

export async function HomepageSections({ sections, featured, arrivals, bestSellers, categories }: Props) {
  const rendered = await Promise.all(sections.map(async (section) => {
    const config = section.parsedConfig;
    switch (section.type) {
      case "HERO": {
        const heading = text(config.heading) || section.title || "";
        return (
          <section key={section.id} className="container-luxury pt-6 sm:pt-10">
            <div className="relative overflow-hidden rounded-luxury border border-line bg-surface">
              <div className="grid items-center gap-8 p-8 sm:p-14 lg:grid-cols-2 lg:p-20">
                <div className={`max-w-xl space-y-6 ${config.align === "center" ? "mx-auto text-center" : ""}`}>
                  {text(config.eyebrow) ? <span className="inline-flex rounded-full bg-secondary/20 px-4 py-2 text-xs font-medium text-primary">{text(config.eyebrow)}</span> : null}
                  <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{heading}</h1>
                  {text(config.subheading) ? <p className="max-w-md text-base leading-8 text-ink/65">{text(config.subheading)}</p> : null}
                  <div className={`flex flex-wrap gap-3 ${config.align === "center" ? "justify-center" : ""}`}>
                    {text(config.ctaLabel) ? <Cta label={text(config.ctaLabel)} to={href(config.ctaHref, "/shop")} /> : null}
                    {text(config.secondaryLabel) ? <Link href={href(config.secondaryHref, "/shop")} className="inline-flex min-h-12 items-center rounded-2xl border border-primary px-6 text-sm font-semibold text-primary hover:bg-primary hover:text-white">{text(config.secondaryLabel)}</Link> : null}
                  </div>
                </div>
                <div className="relative hidden h-[420px] overflow-hidden rounded-luxury bg-line/40 lg:block">
                  <ManagedImage src={text(config.image)} alt={heading} className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
          </section>
        );
      }
      case "BANNER": {
        const image = text(config.image);
        const alt = text(config.alt) || section.title || "بنر";
        return (
          <section key={section.id} className="container-luxury mt-10">
            <Link href={href(config.href, "/shop")} className="block overflow-hidden rounded-luxury border border-line">
              <ManagedImage src={image} alt={alt} className="max-h-[420px] w-full object-cover" />
            </Link>
          </section>
        );
      }
      case "FEATURED_CATEGORIES": {
        const ids = Array.isArray(config.categoryIds) ? config.categoryIds.filter((id): id is string => typeof id === "string") : [];
        const selected = (ids.length ? categories.filter((category) => ids.includes(category.id)) : categories).slice(0, numberValue(config.limit, 5));
        return (
          <section key={section.id} className="container-luxury mt-20">
            <SectionHeading title={section.title ?? "دسته‌بندی‌ها"} subtitle={section.subtitle} ctaLabel={text(config.ctaLabel)} ctaHref={href(config.ctaHref, "/shop")} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {selected.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`} className="surface-card group flex min-h-40 flex-col justify-between p-5 transition-transform hover:-translate-y-1">
                  <span className="text-sm font-semibold">{category.name}</span>
                  <span className="text-xs text-ink/50">{formatNumber(category._count.products)} محصول</span>
                  <ArrowLeft className="h-5 w-5 text-primary transition-transform group-hover:-translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        );
      }
      case "FEATURED_PRODUCTS":
      case "NEW_ARRIVALS":
      case "BEST_SELLERS": {
        const limit = numberValue(config.limit, 4);
        const ids = Array.isArray(config.productIds) ? config.productIds.filter((id): id is string => typeof id === "string") : [];
        const products = section.type === "FEATURED_PRODUCTS"
          ? (ids.length ? await listProductsByIds(ids, limit) : featured.slice(0, limit))
          : section.type === "NEW_ARRIVALS" ? arrivals.slice(0, limit) : bestSellers.slice(0, limit);
        return (
          <section key={section.id} className="container-luxury mt-20">
            <SectionHeading title={section.title ?? (section.type === "NEW_ARRIVALS" ? "تازه رسیده‌ها" : section.type === "BEST_SELLERS" ? "پرفروش‌ها" : "محصولات ویژه")} subtitle={section.subtitle} ctaLabel={text(config.ctaLabel)} ctaHref={href(config.ctaHref, "/shop")} />
            <ProductGrid products={products} />
          </section>
        );
      }
      case "PROMOTIONAL": {
        const heading = text(config.heading) || section.title || "پیشنهاد ویژه";
        return (
          <section key={section.id} className="container-luxury mt-20">
            <div className={`relative overflow-hidden rounded-luxury px-8 py-12 sm:px-14 sm:py-16 ${config.tone === "secondary" ? "bg-secondary" : config.tone === "dark" ? "bg-ink" : "bg-primary"} text-white`}>
              <div className="relative z-10 max-w-xl space-y-4">
                <h2 className="text-3xl font-semibold sm:text-4xl">{heading}</h2>
                {text(config.text) ? <p className="whitespace-pre-line text-sm leading-7 text-white/80">{text(config.text)}</p> : null}
                {text(config.ctaLabel) ? <Link href={href(config.ctaHref, "/shop")} className="inline-flex min-h-12 items-center rounded-2xl bg-white px-6 text-sm font-semibold text-primary hover:bg-white/90">{text(config.ctaLabel)}</Link> : null}
              </div>
              <div aria-hidden className="absolute -left-10 -top-16 h-72 w-72 rounded-full border-40 border-white/5" />
            </div>
          </section>
        );
      }
      case "SEASONAL_COLLECTION": {
        return (
          <section key={section.id} className="container-luxury mt-20">
            <div className="grid items-center gap-6 overflow-hidden rounded-luxury border border-line bg-surface lg:grid-cols-2">
              <ManagedImage src={text(config.image)} alt={text(config.heading)} className="h-full max-h-[460px] w-full object-cover" />
              <div className="space-y-4 p-8 sm:p-12">
                <h2 className="text-3xl font-semibold">{text(config.heading) || section.title}</h2>
                {text(config.text) ? <p className="whitespace-pre-line text-sm leading-7 text-ink/65">{text(config.text)}</p> : null}
                {text(config.ctaLabel) ? <Cta label={text(config.ctaLabel)} to={href(config.ctaHref, config.collectionSlug ? `/category/${text(config.collectionSlug)}` : "/shop")} /> : null}
              </div>
            </div>
          </section>
        );
      }
      case "TESTIMONIALS": {
        const items = Array.isArray(config.items) ? config.items as Array<Record<string, unknown>> : [];
        return (
          <section key={section.id} className="container-luxury mt-20">
            <SectionHeading title={section.title ?? "نظرات مشتریان"} subtitle={section.subtitle} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.slice(0, 12).map((item, index) => (
                <figure key={index} className="surface-card p-6">
                  <div className="mb-3 flex gap-0.5 text-amber-500" aria-label={`${numberValue(item.rating, 5)} از ۵`}>
                    {Array.from({ length: 5 }, (_, star) => <Star key={star} className={`h-4 w-4 ${star < numberValue(item.rating, 5) ? "fill-current" : "opacity-25"}`} />)}
                  </div>
                  <blockquote className="text-sm leading-7 text-ink/70">{text(item.text)}</blockquote>
                  <figcaption className="mt-4 text-xs font-medium text-primary">{text(item.name)}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
      }
      case "CUSTOM_CONTENT": {
        return (
          <section key={section.id} className="container-luxury mt-20">
            <div className="surface-card grid gap-6 p-8 sm:p-12 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold">{text(config.heading) || section.title}</h2>
                <p className="whitespace-pre-line text-sm leading-8 text-ink/65">{text(config.body)}</p>
                {text(config.ctaLabel) ? <Cta label={text(config.ctaLabel)} to={href(config.ctaHref, "/about")} /> : null}
              </div>
              {text(config.image) ? <ManagedImage src={text(config.image)} alt={text(config.heading)} className="h-full max-h-[360px] w-full rounded-luxury object-cover" /> : null}
            </div>
          </section>
        );
      }
      default:
        return null;
    }
  }));
  return <>{rendered}</>;
}
