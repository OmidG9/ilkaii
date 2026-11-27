import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";
import { getCollectionsShowcase } from "@/services/storefront";
import { ButtonLink } from "@/components/ui/button";
import { Marquee, Stat, themeBackground } from "@/components/editorial";
import { formatNumber } from "@/lib/persian";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کالکشن‌ها",
  description: "کالکشن‌های فصلی ilkaii؛ از خلوت لوکس تا خیابان و حرکت.",
  alternates: { canonical: "/collections" },
};

const spans = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-4",
  "lg:col-span-4",
];

export default async function CollectionsPage() {
  const showcase = await getCollectionsShowcase();
  const totalProducts = showcase.reduce((sum, item) => sum + (item.category?._count.products ?? 0), 0);

  return (
    <div className="pb-24">
      <section className="container-luxury pt-8 sm:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-8">
          <div className="max-w-3xl">
            <p className="eyebrow">THE COLLECTIONS / ۱۴۰۴</p>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl lg:text-8xl">
              فصل‌ها،
              <br />
              <span className="font-display italic text-primary/45">در قاب</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-ink/55">
              پنج کالکشن، پنج موقعیت. هر مجموعه از یک نیاز واقعی شروع شده و به قطعه‌هایی رسیده که با هم، یک کمد آرام و کامل می‌سازند.
            </p>
          </div>
          <div className="flex items-center gap-8">
            <Stat value={formatNumber(showcase.length)} label="کالکشن فعال" />
            <Stat value={formatNumber(totalProducts)} label="قطعهٔ قابل خرید" />
          </div>
        </div>
      </section>

      <Marquee
        className="mt-8"
        items={["FIVE MOODS, ONE WARDROBE", "QUIET / STREET / MOTION / LAYERS / DENIM", "پنج کالکشن، یک کمد", "SEASON ۱۴۰۴"]}
      />

      <section className="container-luxury mt-12">
        <div className="grid gap-5 lg:grid-cols-12">
          {showcase.map(({ collection, category }, index) => (
            <Link
              key={collection.slug}
              href={`/collections/${collection.slug}`}
              className={`group relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[32px] p-7 sm:p-9 ${spans[index] ?? "lg:col-span-4"} ${index === 0 ? "sm:min-h-[460px]" : ""}`}
              style={themeBackground(collection.theme)}
            >
              <div aria-hidden className="absolute -left-10 -top-16 h-48 w-48 rounded-full border-[32px] border-current opacity-[0.06] transition-transform duration-700 group-hover:scale-125" />
              <div aria-hidden className="pointer-events-none absolute bottom-4 left-4 font-display text-[110px] leading-none opacity-[0.08] sm:text-[150px]">{collection.index}</div>

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] tracking-[0.32em] opacity-60">{collection.englishTitle.toUpperCase()}</p>
                  <h2 className={`mt-3 font-semibold ${index === 0 ? "text-4xl sm:text-6xl" : "text-3xl sm:text-4xl"}`}>{collection.title}</h2>
                </div>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-current/25 opacity-70 transition-all group-hover:bg-current/10 group-hover:opacity-100">
                  <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 group-hover:translate-y-1" />
                </span>
              </div>

              <div className="relative mt-10 max-w-xl">
                <p className="text-sm leading-7 opacity-70">{collection.subtitle}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] tracking-[0.16em] opacity-55">
                  <span>{collection.season}</span>
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span>{formatNumber(category?._count.products ?? 0)} قطعه</span>
                  <span className="h-1 w-1 rounded-full bg-current" />
                  <span>{category?.name ?? "به‌زودی"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-luxury mt-20 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="eyebrow">HOW WE BUILD A COLLECTION</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">از یک ایدهٔ کوچک، تا یک قاب کامل</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { index: "۰۱", title: "نیاز", text: "هر کالکشن از یک موقعیت واقعی شروع می‌شود: صبح، کار، حرکت، شب." },
            { index: "۰۲", title: "پارچه", text: "پارچه پیش از طرح انتخاب می‌شود؛ چون فرم را پارچه می‌سازد." },
            { index: "۰۳", title: "قاب", text: "قطعه‌ها طوری انتخاب می‌شوند که با هم، چند استایل کامل بسازند." },
          ].map((item) => (
            <div key={item.index} className="rounded-2xl border border-line bg-surface p-5">
              <p className="font-display text-2xl text-primary/35">{item.index}</p>
              <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs leading-6 text-ink/55">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-luxury mt-20">
        <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">CAN&apos;T CHOOSE?</p>
            <h2 className="mt-3 text-2xl font-semibold">همه را یک‌جا ببینید</h2>
            <p className="mt-2 text-sm leading-7 text-ink/55">اگر هنوز مطمئن نیستید، از فروشگاه کامل شروع کنید و با فیلتر سایز و رنگ، مسیر را کوتاه‌تر کنید.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/shop">همهٔ محصولات</ButtonLink>
            <ButtonLink href="/lookbook" variant="outline">لوک‌بوک</ButtonLink>
          </div>
        </div>
      </section>

      <p className="container-luxury mt-10 text-center text-xs text-ink/35">
        <Link href="/new-arrivals" className="inline-flex items-center gap-1 hover:text-primary">تازه‌ترین قطعه‌ها <ArrowLeft className="h-3 w-3" /></Link>
      </p>
    </div>
  );
}
