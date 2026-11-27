import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug } from "@/services/catalog";
import { listProductReviews } from "@/services/account";
import { getSiteConfig } from "@/config/site";
import { collectionForCategory } from "@/config/editorial";
import { ProductGallery } from "@/components/product-gallery";
import { VariantPicker } from "@/components/variant-picker";
import { ProductGrid } from "@/components/product-grid";
import { ReviewForm } from "@/components/review-form";
import { TrackEvent } from "@/components/track-event";
import { JsonLd } from "@/components/json-ld";
import { Badge, Breadcrumbs, Card, SectionTitle } from "@/components/ui/display";
import { formatJalali, formatNumber } from "@/lib/persian";
import { toToman } from "@/lib/money";
import type { RawSearchParams } from "@/lib/search-params";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<RawSearchParams>;
};

async function load(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await load(slug);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const image = product.heroImage ?? product.images[0]?.url;
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.shortDescription ?? product.description ?? undefined,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      title: product.name,
      description: product.shortDescription ?? product.description ?? undefined,
      images: image ? [{ url: image.startsWith("http") ? image : `${base}${image}`, alt: product.name }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await load(slug);
  const [reviews, site] = await Promise.all([
    listProductReviews(product.id),
    getSiteConfig(),
  ]);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const collection = collectionForCategory(product.category.slug);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.images.map((image) => image.url.startsWith("http") ? image.url : `${base}${image.url}`),
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    aggregateRating: product.averageRating && product.reviewCount > 0
      ? { "@type": "AggregateRating", ratingValue: Number(product.averageRating), reviewCount: product.reviewCount }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: product.price * 10,
      availability: product.availableStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${base}/product/${product.slug}`,
    },
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: base },
      { "@type": "ListItem", position: 2, name: product.category.name, item: `${base}/category/${product.category.slug}` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${base}/product/${product.slug}` },
    ],
  };

  return (
    <div className="container-luxury py-10">
      <JsonLd data={structuredData} />
      <JsonLd data={breadcrumbData} />
      <TrackEvent name="product_view" properties={{ productId: product.id, categoryId: product.category.id }} />
      <Breadcrumbs items={[{ label: product.category.name, href: `/category/${product.category.slug}` }, { label: product.name }]} />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery
          images={product.images.map((image) => ({
            id: image.id,
            url: image.url,
            altText: image.altText,
            color: image.color,
          }))}
          name={product.name}
        />
        <div className="space-y-7">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{product.category.name}</Badge>
              {product.brand ? <Badge>{product.brand.name}</Badge> : null}
              {product.discount > 0 ? <Badge tone="danger">{formatNumber(product.discount)}٪ تخفیف</Badge> : null}
            </div>
            <h1 className="text-3xl font-semibold leading-snug sm:text-4xl">{product.name}</h1>
            {collection ? (
              <Link href={`/collections/${collection.slug}`} className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-primary/70 hover:text-primary">
                از کالکشن {collection.title} <ArrowLeft className="h-3 w-3" />
              </Link>
            ) : null}
            <p className="mt-2 text-xs text-ink/50">کد محصول: <span dir="ltr">{product.sku}</span></p>
          </div>

          <VariantPicker
            productId={product.id}
            slug={product.slug}
            price={product.price}
            wishlistEnabled={site.features.wishlist}
            variants={product.variants.map((variant) => ({
              id: variant.id,
              size: variant.size,
              color: variant.color,
              stock: variant.stock,
              isAvailable: variant.isAvailable,
              price: variant.price ? toToman(variant.price) : null,
            }))}
          />

          {product.shortDescription ? <p className="text-sm leading-7 text-ink/70">{product.shortDescription}</p> : null}

          <div className="grid grid-cols-3 gap-2 border-y border-line py-4">
            {[
              { icon: Truck, title: "ارسال سراسری", text: "پست و پیک" },
              { icon: RotateCcw, title: "۷ روز بازگشت", text: "طبق شرایط" },
              { icon: ShieldCheck, title: "پرداخت امن", text: "تأیید سرور" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <Icon className="mx-auto h-4 w-4 text-primary/60" />
                <p className="mt-2 text-[10px] font-semibold">{title}</p>
                <p className="text-[9px] text-ink/40">{text}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-line pt-6 text-sm">
            <h2 className="font-semibold">جزئیات محصول</h2>
            {product.material ? <p className="text-ink/65">جنس: {product.material}</p> : null}
            {product.fabricComposition ? <p className="text-ink/65">ترکیب پارچه: {product.fabricComposition}</p> : null}
            {product.careInstructions ? <p className="text-ink/65">دستور شستشو: {product.careInstructions}</p> : null}
            {site.features.sizeGuide ? (
              <p className="text-xs text-ink/50">برای انتخاب دقیقتر، <a href="/size-guide" className="text-primary underline">راهنمای سایز</a> را ببینید.</p>
            ) : null}
          </div>

          <Card className="p-5 text-xs leading-6 text-ink/60">
            سفارشها در تاریخ {formatJalali(new Date())} طبق شرایط حمل و نقل پردازش میشوند. تمام قیمتها به تومان است.
          </Card>
        </div>
      </div>

      {product.description ? (
        <section className="mt-20 max-w-3xl">
          <SectionTitle title="توضیحات" />
          <div className="whitespace-pre-line text-sm leading-8 text-ink/70">{product.description}</div>
        </section>
      ) : null}

      {site.features.reviews ? (
        <section className="mt-20 grid gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle title="نظرات مشتریان" subtitle={`${formatNumber(reviews.length)} نظر تأییدشده`} />
            {reviews.length ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        {[review.user.firstName, review.user.lastName].filter(Boolean).join(" ") || "مشتری"}
                      </p>
                      <span className="text-xs text-ink/50" dir="ltr">{formatJalali(review.createdAt)}</span>
                    </div>
                    <p className="text-xs text-primary">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                    {review.title ? <p className="mt-2 text-sm font-medium">{review.title}</p> : null}
                    <p className="mt-1 text-sm leading-6 text-ink/70">{review.comment}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/55">هنوز نظری برای این محصول ثبت نشده است.</p>
            )}
          </div>
          <ReviewForm productId={product.id} />
        </section>
      ) : null}

      {product.related.length ? (
        <section className="mt-20">
          <SectionTitle title="محصولات مشابه" href={`/category/${product.category.slug}`} linkLabel="مشاهده همه" />
          <ProductGrid products={product.related} />
        </section>
      ) : null}
    </div>
  );
}
