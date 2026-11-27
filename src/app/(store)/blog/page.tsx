import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, BookOpen, PenLine, Sparkles } from "lucide-react";
import { listPublishedPosts } from "@/services/cms";
import { formatJalali } from "@/lib/persian";
import { NewsletterForm } from "@/components/newsletter-form";
import { ButtonLink } from "@/components/ui/button";
import { Marquee } from "@/components/editorial";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ژورنال",
  description: "مقاله‌ها، راهنمای استایل و داستان‌های پشت کالکشن‌های ilkaii.",
  alternates: { canonical: "/blog" },
};

const topics = ["استایل", "پارچه", "پایداری", "راهنمای خرید", "پشت صحنه"];

function Cover({ src, title, className = "" }: { src: string | null; title: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={title}
      className={`relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/40 bg-cover bg-center ${className}`}
      style={src ? { backgroundImage: `url(${src})` } : undefined}
    >
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
    </div>
  );
}

export default async function BlogIndexPage() {
  const posts = await listPublishedPosts();
  const [featured, ...rest] = posts;
  const now = new Date();

  return (
    <div className="pb-24">
      <section className="container-luxury pt-8 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
          <div>
            <p className="eyebrow">THE ILKAII JOURNAL / ISSUE ۰۱</p>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.03] sm:text-7xl">
              ژورنال
              <span className="font-display italic text-primary/40"> ilkaii</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-ink/55">
              دربارهٔ پارچه، فرم و انتخاب‌هایی که لباس را از یک کالا به یک همراه تبدیل می‌کنند. آرام بخوانید، آرام بخرید.
            </p>
          </div>
          <div className="text-left text-xs text-ink/40 sm:text-right">
            <p>{formatJalali(now)}</p>
            <p className="mt-1">تهران / شمارهٔ ۰۱</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((topic) => <span key={topic} className="rounded-full border border-line bg-surface px-3 py-1 text-[10px] text-ink/45">{topic}</span>)}
            </div>
          </div>
        </div>
      </section>

      {featured ? (
        <>
          <section className="container-luxury mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Link href={`/blog/${featured.slug}`} className="group relative overflow-hidden rounded-[32px] border border-line bg-surface">
              <Cover src={featured.coverImage} title={featured.title} className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.02]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-6 sm:p-8">
                <p className="text-[10px] tracking-[0.24em] text-white/60">FEATURED STORY</p>
                <h2 className="mt-3 max-w-2xl text-balance text-2xl font-semibold text-white sm:text-3xl group-hover:underline group-hover:decoration-white/30 group-hover:underline-offset-4">{featured.title}</h2>
                {featured.excerpt ? <p className="mt-2 line-clamp-2 max-w-xl text-xs leading-6 text-white/65">{featured.excerpt}</p> : null}
                <div className="mt-4 flex items-center gap-3 text-[10px] text-white/50">
                  <span>{featured.publishedAt ? formatJalali(featured.publishedAt) : "به‌زودی"}</span>
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                  <span>{featured.readingMinutes} دقیقه مطالعه</span>
                  <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:translate-y-1" />
                </div>
              </div>
            </Link>

            <div className="flex flex-col justify-between rounded-[32px] border border-line bg-surface p-6 sm:p-8">
              <div>
                <p className="flex items-center gap-2 text-[10px] tracking-[0.24em] text-ink/35"><BookOpen className="h-3.5 w-3.5" /> IN THIS ISSUE</p>
                <div className="mt-5 divide-y divide-line">
                  {rest.slice(0, 3).map((post) => (
                    <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="font-display text-2xl text-primary/20">{String(rest.indexOf(post) + 2).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">{post.title}</h3>
                        <p className="mt-1 text-[10px] text-ink/40">{post.publishedAt ? formatJalali(post.publishedAt) : ""} — {post.readingMinutes} دقیقه</p>
                      </div>
                    </Link>
                  ))}
                  {rest.length === 0 ? <p className="py-4 text-xs text-ink/45">شمارهٔ بعدی در حال آماده‌سازی است.</p> : null}
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-canvas p-4">
                <p className="text-xs font-semibold">خبرنامهٔ ژورنال</p>
                <p className="mt-1 text-[11px] leading-5 text-ink/45">مقالهٔ تازه را در ایمیل دریافت کنید.</p>
                <NewsletterForm compact />
              </div>
            </div>
          </section>

          {rest.length > 3 ? (
            <section className="container-luxury mt-16">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">MORE STORIES</p>
                  <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">از شمارهٔ جاری</h2>
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.slice(3).map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-[28px] border border-line bg-surface">
                    <Cover src={post.coverImage} title={post.title} className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.02]" />
                    <div className="p-5">
                      <p className="text-[10px] text-ink/40">{post.publishedAt ? formatJalali(post.publishedAt) : ""} — {post.readingMinutes} دقیقه</p>
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary">{post.title}</h3>
                      {post.excerpt ? <p className="mt-2 line-clamp-3 text-xs leading-6 text-ink/55">{post.excerpt}</p> : null}
                      <span className="mt-4 inline-flex items-center gap-1 text-[11px] text-primary">ادامهٔ مطلب <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" /></span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="container-luxury mt-10">
          <div className="relative overflow-hidden rounded-[32px] border border-line bg-surface">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-8 sm:p-12">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><PenLine className="h-5 w-5" /></span>
                <h2 className="mt-6 text-balance text-3xl font-semibold">شمارهٔ اول در حال نوشتن است.</h2>
                <p className="mt-4 max-w-xl text-sm leading-8 text-ink/55">
                  ژورنال ilkaii جای تبلیغات نیست؛ محل نگه‌داشتن چیزهایی است که یاد گرفته‌ایم: انتخاب پارچه، نگهداری لباس، و این‌که چطور کمتر ولی دقیق‌تر بخریم.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "پارچه چیست؟", text: "تفاوت پنبه، جین و الیاف ترکیبی" },
                    { title: "کمد کوچک‌تر", text: "چطور با کمتر، بیشتر بسازیم" },
                    { title: "پشت صحنهٔ کالکشن", text: "از طرح تا بسته‌بندی" },
                    { title: "راهنمای نگهداری", text: "عمر لباس را دو برابر کنید" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-line bg-canvas p-4">
                      <p className="text-xs font-semibold">{item.title}</p>
                      <p className="mt-1 text-[11px] text-ink/45">{item.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/collections">دیدن کالکشن‌ها</ButtonLink>
                  <ButtonLink href="/contact" variant="outline">پیشنهاد موضوع</ButtonLink>
                </div>
              </div>
              <div className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-primary/25 via-secondary/30 to-canvas p-8">
                <span aria-hidden className="absolute -left-4 top-4 font-display text-[200px] leading-none text-white/20">J</span>
                <div className="relative flex h-full flex-col justify-between">
                  <p className="text-[10px] tracking-[0.3em] text-white/60">JOURNAL / ۰۱</p>
                  <div className="rounded-3xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur">
                    <Sparkles className="h-5 w-5" />
                    <p className="mt-3 font-display text-xl italic">Less, but better.</p>
                    <p className="mt-2 text-xs leading-6 text-white/65">این جمله، معیار ما برای هر قطعه است.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <Marquee
        className="mt-16"
        items={["READ SLOWLY", "STYLE IS A PRACTICE", "دربارهٔ پارچه، فرم و انتخاب", "THE ILKAII JOURNAL", "ISSUE ۰۱"]}
      />

      <section className="container-luxury mt-16">
        <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">A SMALL INVITATION</p>
            <h2 className="mt-3 text-2xl font-semibold">سؤالی دارید که ارزش نوشتن دارد؟</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-ink/55">موضوع پیشنهادی، تجربهٔ خرید یا سؤالی که پاسخش را پیدا نکردید؛ برای ما بفرستید.</p>
          </div>
          <ButtonLink href="/contact" variant="outline">نوشتن به ما <ArrowLeft className="h-4 w-4" /></ButtonLink>
        </div>
      </section>
    </div>
  );
}
