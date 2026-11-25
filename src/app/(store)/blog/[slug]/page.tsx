import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPost } from "@/services/cms";
import { formatJalali } from "@/lib/persian";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) return { title: "نوشته یافت نشد" };
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.metaTitle || post.title, description: post.metaDescription || undefined, images: post.coverImage ? [post.coverImage] : undefined },
  };
}

export default async function BlogPostView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound();
  return (
    <article className="container-luxury max-w-3xl py-12 sm:py-16">
      <header className="mb-8 border-b border-line pb-6">
        <p className="text-xs text-ink/45">{post.publishedAt ? formatJalali(post.publishedAt) : ""} — {post.readingMinutes} دقیقه مطالعه</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{post.title}</h1>
        {post.excerpt ? <p className="mt-3 text-sm leading-7 text-ink/60">{post.excerpt}</p> : null}
      </header>
      {post.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt={post.title} className="mb-8 max-h-[460px] w-full rounded-luxury object-cover" />
      ) : null}
      <div className="whitespace-pre-line text-sm leading-8 text-ink/75">{post.content}</div>
    </article>
  );
}
