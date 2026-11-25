import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedPosts } from "@/services/cms";
import { formatJalali } from "@/lib/persian";
import { EmptyState } from "@/components/ui/display";

export const metadata: Metadata = { title: "وبلاگ", description: "مقاله‌ها و راهنمای استایل فروشگاه" };
export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts();
  return (
    <div className="container-luxury py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold sm:text-4xl">وبلاگ</h1>
        <p className="mt-2 text-sm text-ink/55">راهنماها، داستان‌ها و نکته‌های استایل.</p>
      </header>
      {posts.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="surface-card group overflow-hidden">
              {post.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImage} alt={post.title} loading="lazy" className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
              ) : <div className="h-48 bg-line/40" />}
              <div className="p-5">
                <p className="text-[11px] text-ink/45">{post.publishedAt ? formatJalali(post.publishedAt) : ""} — {post.readingMinutes} دقیقه مطالعه</p>
                <h2 className="mt-2 text-lg font-semibold group-hover:text-primary">{post.title}</h2>
                {post.excerpt ? <p className="mt-2 line-clamp-3 text-xs leading-6 text-ink/60">{post.excerpt}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      ) : <EmptyState title="هنوز نوشته‌ای منتشر نشده است" description="به‌زودی مقاله‌های تازه در این بخش منتشر می‌شود." />}
    </div>
  );
}
