import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpLeft } from "lucide-react";
import { getPublicBrandBySlug, getPublicBrands } from "@/services/storefront";
import { ProductGrid } from "@/components/product-grid";
import { ButtonLink } from "@/components/ui/button";
import { EditorialSectionTitle, Marquee, Stat } from "@/components/editorial";
import { SafeImage } from "@/components/safe-image";
import { formatNumber } from "@/lib/persian";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicBrandBySlug(slug).catch(() => null);
  if (!result) return { title: "برند یافت نشد", robots: { index: false } };
  return {
    title: result.brand.name,
    description: result.brand.description ?? `محصولات برند ${result.brand.name} در ilkaii`,
    alternates: { canonical: `/brands/${result.brand.slug}` },
  };
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const [result, allBrands] = await Promise.all([getPublicBrandBySlug(slug), getPublicBrands()]);
  if (!result) notFound();

  const { brand, products } = result;
  const others = allBrands.filter((item) => item.id !== brand.id).slice(0, 4);
  const initial = brand.name.slice(0, 1).toUpperCase();

  return (
    <div className="pb-24">
      <div className="container-luxury pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 text-[11px] text-ink/45">
          <Link href="/brands" className="inline-flex items-center gap-2 hover:text-primary">
            <ArrowRight className="h-3.5 w-3.5" /> همهٔ برندها
          </Link>
          <span>MAKER PROFILE</span>
        </div>
      </div>

      <section className="container-luxury">
        <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface p-8 sm:p-12 lg:p-16">
          <span aria-hidden className="pointer-events-none absolute -left-8 -top-20 font-display text-[280px] leading-none text-primary/[0.06] sm:text-[380px]">{initial}</span>
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="eyebrow">SELECTED MAKER</p>
              <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl">{brand.name}</h1>
              <p className="mt-6 max-w-xl text-sm leading-8 text-ink/55">
                {brand.description ?? "این برند با تمرکز بر کیفیت پارچه و فرم‌های ماندگار انتخاب شده است. قطعه‌های آن در فروشگاه ilkaii و با همان استانداردهای کیفیت عرضه می‌شوند."}
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="rounded-full border border-line bg-canvas px-4 py-2 text-[11px] text-ink/55">پارچهٔ منتخب</span>
                <span className="rounded-full border border-line bg-canvas px-4 py-2 text-[11px] text-ink/55">تولید محدود</span>
                <span className="rounded-full border border-line bg-canvas px-4 py-2 text-[11px] text-ink/55">قابل بازگشت ۷ روزه</span>
              </div>
            </div>
            <div className="flex items-end gap-8">
              <Stat value={brand._count.products} label="قطعه در فروشگاه" />
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl border border-line bg-canvas p-4">
                {brand.logo ? (
                  <span className="relative h-full w-full">
                    <SafeImage src={brand.logo} alt={brand.name} fill sizes="96px" className="object-contain" fallbackLabel={initial} />
                  </span>
                ) : (
                  <span className="font-display text-4xl text-primary/50">{initial}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee className="mt-8" items={[brand.name, "SELECTED BY ILKAII", "QUALITY FIRST", "SMALL STUDIO", formatNumber(brand._count.products) + " PIECES"]} />

      <section className="container-luxury mt-16">
        <EditorialSectionTitle
          index="THE COLLECTION"
          title={`از ${brand.name}`}
          subtitle="قطعه‌های موجود این برند، همراه با جزئیات سایز و جنس در صفحهٔ هر محصول."
          href="/shop"
          linkLabel="همهٔ فروشگاه"
        />
        <ProductGrid products={products} />
      </section>

      {others.length ? (
        <section className="container-luxury mt-24">
          <EditorialSectionTitle index="OTHER MAKERS" title="برندهای دیگر" href="/brands" linkLabel="همهٔ برندها" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((item) => (
              <Link key={item.id} href={`/brands/${item.slug}`} className="group rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-primary">
                <p className="font-display text-3xl text-primary/30">{item.name.slice(0, 1).toUpperCase()}</p>
                <h3 className="mt-6 text-sm font-semibold group-hover:text-primary">{item.name}</h3>
                <p className="mt-2 text-[11px] text-ink/45">{formatNumber(item._count.products)} قطعه</p>
                <ArrowUpLeft className="mt-5 h-4 w-4 text-ink/30 transition-transform group-hover:-translate-x-1 group-hover:translate-y-1 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-luxury mt-20">
        <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">NEED A SECOND OPINION?</p>
            <h2 className="mt-3 text-2xl font-semibold">برای انتخاب سایز کمک می‌خواهید؟</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-ink/55">راهنمای سایز یا تیم پشتیبانی، مسیر انتخاب را کوتاه‌تر می‌کند.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/size-guide" variant="outline">راهنمای سایز</ButtonLink>
            <ButtonLink href="/contact">تماس با ما</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
