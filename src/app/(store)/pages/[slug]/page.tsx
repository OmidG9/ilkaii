import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPage } from "@/services/cms";
import { formatJalali } from "@/lib/persian";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return { title: "صفحه یافت نشد" };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
    alternates: { canonical: `/pages/${page.slug}` },
    openGraph: { title: page.metaTitle || page.title, description: page.metaDescription || undefined, images: page.ogImage ? [page.ogImage] : undefined },
  };
}

export default async function CmsPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) notFound();
  return (
    <article className="container-luxury max-w-3xl py-12 sm:py-16">
      <header className="mb-8 border-b border-line pb-6">
        <p className="text-xs text-ink/45">{page.publishedAt ? formatJalali(page.publishedAt) : "صفحه محتوایی"}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{page.title}</h1>
        {page.excerpt ? <p className="mt-3 text-sm leading-7 text-ink/60">{page.excerpt}</p> : null}
      </header>
      <div className="whitespace-pre-line text-sm leading-8 text-ink/75">{page.content}</div>
    </article>
  );
}
