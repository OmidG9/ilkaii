import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, LifeBuoy } from "lucide-react";
import { getPublishedPage, listPublishedPages } from "@/services/cms";
import { getSiteConfig } from "@/config/site";
import { formatJalali } from "@/lib/persian";
import { Breadcrumbs } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug).catch(() => null);
  if (!page) return { title: "صفحه یافت نشد", robots: { index: false } };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
    alternates: { canonical: `/pages/${page.slug}` },
    openGraph: { title: page.metaTitle || page.title, description: page.metaDescription || undefined, images: page.ogImage ? [page.ogImage] : undefined },
  };
}

export default async function CmsPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, pages, site] = await Promise.all([
    getPublishedPage(slug).catch(() => null),
    listPublishedPages().catch(() => []),
    getSiteConfig(),
  ]);
  if (!page) notFound();

  const related = pages.filter((item) => item.slug !== page.slug).slice(0, 4);

  return (
    <div className="container-luxury py-10 sm:py-14">
      <Breadcrumbs items={[{ label: page.title }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_240px] lg:items-start">
        <article className="overflow-hidden rounded-[32px] border border-line bg-surface">
          <header className="relative border-b border-line bg-canvas p-8 sm:p-10">
            <div aria-hidden className="grain absolute inset-0 opacity-50" />
            <div className="relative">
              <p className="eyebrow">ILKAII / PAGE</p>
              <h1 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">{page.title}</h1>
              {page.excerpt ? <p className="mt-4 max-w-2xl text-sm leading-8 text-ink/55">{page.excerpt}</p> : null}
              <p className="mt-5 flex items-center gap-2 text-[11px] text-ink/40">
                <CalendarDays className="h-3.5 w-3.5" />
                {page.publishedAt ? formatJalali(page.publishedAt) : "صفحهٔ محتوایی"}
              </p>
            </div>
          </header>
          <div className="whitespace-pre-line p-8 text-sm leading-9 text-ink/75 sm:p-10">{page.content}</div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <FileText className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm font-semibold">{site.name}</p>
            <p className="mt-1 text-xs leading-6 text-ink/45">صفحه‌های محتوایی توسط تیم {site.name} مدیریت می‌شوند.</p>
            <ButtonLink href="/shop" size="sm" className="mt-4 w-full">مشاهدهٔ فروشگاه</ButtonLink>
          </div>
          {related.length ? (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[10px] tracking-[0.24em] text-ink/35">MORE PAGES</p>
              <div className="mt-3 space-y-1">
                {related.map((item) => (
                  <Link key={item.slug} href={`/pages/${item.slug}`} className="flex min-h-9 items-center justify-between gap-2 rounded-lg px-2 text-xs text-ink/55 hover:bg-canvas hover:text-primary">
                    <span className="line-clamp-1">{item.title}</span>
                    <ArrowLeft className="h-3 w-3 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          <Link href="/contact" className="flex items-center gap-2 px-1 text-xs text-ink/45 hover:text-primary"><LifeBuoy className="h-3.5 w-3.5" /> سؤالی دارید؟</Link>
        </aside>
      </div>
    </div>
  );
}
