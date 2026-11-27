import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, Clock3, PenLine } from "lucide-react";
import { getPublishedPost, listPublishedPosts } from "@/services/cms";
import { getSiteConfig } from "@/config/site";
import { formatJalali } from "@/lib/persian";
import { JsonLd } from "@/components/json-ld";
import { Breadcrumbs } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { ShareButton } from "@/components/share-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug).catch(() => null);
  if (!post) return { title: "نوشته یافت نشد", robots: { index: false } };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export default async function BlogPostView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, allPosts, site] = await Promise.all([
    getPublishedPost(slug).catch(() => null),
    listPublishedPosts().catch(() => []),
    getSiteConfig(),
  ]);
  if (!post) notFound();

  const related = allPosts.filter((item) => item.slug !== post.slug).slice(0, 3);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImage ? (post.coverImage.startsWith("http") ? post.coverImage : `${base}${post.coverImage}`) : undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Organization", name: site.name },
    publisher: { "@type": "Organization", name: site.name },
    mainEntityOfPage: `${base}/blog/${post.slug}`,
  };

  return (
    <div className="pb-24">
      <JsonLd data={structuredData} />
      <div className="container-luxury pt-6">
        <Breadcrumbs items={[{ label: "ژورنال", href: "/blog" }, { label: post.title }]} />
      </div>

      <article className="container-luxury">
        <header className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">THE ILKAII JOURNAL</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.15] sm:text-5xl">{post.title}</h1>
          {post.excerpt ? <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-ink/55">{post.excerpt}</p> : null}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-ink/45">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {post.publishedAt ? formatJalali(post.publishedAt) : "به‌زودی"}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {post.readingMinutes} دقیقه مطالعه</span>
            <span className="inline-flex items-center gap-1.5"><PenLine className="h-3.5 w-3.5" /> تحریریهٔ {site.name}</span>
          </div>
          <div className="mt-5 flex justify-center"><ShareButton title={post.title} /></div>
        </header>

        {post.coverImage ? (
          <div
            role="img"
            aria-label={post.title}
            className="mx-auto mt-10 aspect-[16/9] w-full max-w-5xl rounded-[32px] border border-line bg-gradient-to-br from-primary/25 to-secondary/30 bg-cover bg-center"
            style={{ backgroundImage: `url(${post.coverImage})` }}
          />
        ) : (
          <div className="mx-auto mt-10 flex aspect-[16/6] w-full max-w-5xl items-center justify-center rounded-[32px] border border-line bg-gradient-to-br from-primary/20 to-secondary/30">
            <span className="font-display text-4xl text-white/50">{site.name}</span>
          </div>
        )}

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-[1fr_220px] lg:items-start">
          <div className="min-w-0">
            <div className="whitespace-pre-line text-[15px] leading-9 text-ink/75">{post.content}</div>

            {post.tags ? (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
                {post.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[10px] text-ink/45">#{tag}</span>
                ))}
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-6">
              <div>
                <p className="text-sm font-semibold">این مطلب را مفید دیدید؟</p>
                <p className="mt-1 text-xs text-ink/45">مقالهٔ بعدی را در ژورنال بخوانید یا کالکشن مرتبط را ببینید.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href="/blog" variant="outline" size="sm"><ArrowRight className="h-3.5 w-3.5" /> ژورنال</ButtonLink>
                <ButtonLink href="/collections" size="sm"><BookOpen className="h-3.5 w-3.5" /> کالکشن‌ها</ButtonLink>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="text-[10px] tracking-[0.24em] text-ink/35">IN THIS ARTICLE</p>
              <p className="mt-3 text-xs leading-6 text-ink/55">این مطلب بخشی از ژورنال {site.name} است؛ نوشته‌هایی دربارهٔ پارچه، فرم و انتخاب‌های آگاهانه.</p>
              <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs text-ink/55">
                <p className="flex justify-between gap-2"><span>انتشار</span><span>{post.publishedAt ? formatJalali(post.publishedAt) : "—"}</span></p>
                <p className="flex justify-between gap-2"><span>زمان مطالعه</span><span>{post.readingMinutes} دقیقه</span></p>
              </div>
            </div>
            <Link href="/blog" className="flex items-center gap-2 px-1 text-xs text-ink/45 hover:text-primary">
              <ArrowRight className="h-3.5 w-3.5" /> بازگشت به ژورنال
            </Link>
          </aside>
        </div>
      </article>

      {related.length ? (
        <section className="container-luxury mt-20">
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="eyebrow">KEEP READING</p>
              <h2 className="mt-3 text-2xl font-semibold">مقالات مرتبط</h2>
            </div>
            <Link href="/blog" className="text-xs text-primary hover:text-hover">همهٔ مقاله‌ها</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`} className="group overflow-hidden rounded-[26px] border border-line bg-surface">
                <div
                  role="img"
                  aria-label={item.title}
                  className="aspect-[16/10] w-full bg-gradient-to-br from-primary/20 to-secondary/35 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
                  style={item.coverImage ? { backgroundImage: `url(${item.coverImage})` } : undefined}
                />
                <div className="p-5">
                  <p className="text-[10px] text-ink/40">{item.publishedAt ? formatJalali(item.publishedAt) : ""} — {item.readingMinutes} دقیقه</p>
                  <h3 className="mt-2 line-clamp-2 text-base font-semibold group-hover:text-primary">{item.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
