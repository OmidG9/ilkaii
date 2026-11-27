import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowLeft, Quote } from "lucide-react";
import { getLookbookSpreads } from "@/services/storefront";
import { getSiteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";
import { EditorialHero, EditorialImageFrame, EditorialSectionTitle, Marquee, ProductMiniLink, Stat, themeBackground } from "@/components/editorial";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوک‌بوک فصل",
  description: "لوک‌بوک پاییز و زمستان ilkaii؛ چهار فصل بصری از استایل، پارچه و حرکت.",
  alternates: { canonical: "/lookbook" },
};

export default async function LookbookPage() {
  const [spreads, site] = await Promise.all([getLookbookSpreads(), getSiteConfig()]);
  const lead = spreads[0];
  const leadImage = lead?.products[0]?.image ?? null;
  const gallery = spreads.flatMap((spread) => spread.products).slice(0, 4);

  return (
    <div className="pb-24">
      <EditorialHero
        className="pt-6 sm:pt-10"
        eyebrow="لوک‌بوک — فصل ۰۴ / پاییز و زمستان"
        title={
          <>
            چهار قاب از
            <span className="font-display italic"> یک روز </span>
            واقعی
          </>
        }
        description="لوک‌بوک امسال دربارهٔ لباس‌های روی سن نیست؛ دربارهٔ لباس‌هایی است که در صبح‌های شلوغ، مسیرهای شهری و شب‌های آرام پوشیده می‌شوند. همراه با قطعه‌هایی که می‌توانید همین حالا بخرید."
        theme={lead?.chapter.theme ?? { from: "#E9DFD2", to: "#B9A38F", accent: "#5B4737", ink: "dark" }}
        size="grand"
        aside={
          <div className="relative mx-auto max-w-md">
            <EditorialImageFrame src={leadImage} alt={lead?.products[0]?.name ?? "لوک‌بوک ilkaii"} theme={lead?.chapter.theme ?? { from: "#E9DFD2", to: "#B9A38F", accent: "#5B4737", ink: "dark" }} className="aspect-[3/4] shadow-soft" priority />
            <div className="absolute -bottom-6 -right-4 hidden w-48 rounded-2xl border border-white/30 bg-white/85 p-4 text-ink shadow-soft backdrop-blur sm:block">
              <p className="text-[10px] tracking-[0.28em] text-primary/60">COVER STORY</p>
              <p className="mt-2 font-display text-xl">{lead?.chapter.englishTitle ?? site.name}</p>
              <p className="mt-1 text-[11px] text-ink/50">{lead?.chapter.kicker}</p>
            </div>
            <span className="absolute -left-5 -top-5 hidden h-20 w-20 items-center justify-center rounded-full border border-white/50 text-center text-[9px] tracking-[0.2em] text-white/80 sm:flex">
              ۰۴ / ۲۵
            </span>
          </div>
        }
      >
        <a href="#chapters" className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-ink px-6 text-sm font-semibold text-canvas transition-colors hover:bg-ink/85">
          ورق بزنید <ArrowDown className="h-4 w-4" />
        </a>
        <ButtonLink href="/new-arrivals" variant="outline" className="border-current text-current hover:bg-current/10 hover:text-current">
          خرید قطعه‌های لوک‌بوک
        </ButtonLink>
      </EditorialHero>

      <Marquee
        className="mt-8"
        items={["ILKAII LOOKBOOK ۰۴", "AUTUMN / WINTER ۱۴۰۴", "FOUR REAL-LIFE SCENES", "THE QUIET EDIT", "MADE TO BE WORN"]}
      />

      <section className="container-luxury mt-14 grid gap-6 border-b border-line pb-10 sm:grid-cols-3">
        <Stat value="۰۴" label="فصل بصری" />
        <Stat value={`${spreads.length} مجموعه`} label="قطعه‌های قابل خرید" />
        <Stat value="۰۱" label="داستان؛ شما" />
      </section>

      <section id="chapters" className="container-luxury mt-20 space-y-24">
        <EditorialSectionTitle
          index="THE CHAPTERS"
          title="روایت فصل، در چهار پرده"
          subtitle="هر پرده یک موقعیت روزمره است؛ با قطعه‌هایی که می‌توانید در همان قاب ببینید و بخرید."
        />

        {spreads.map((spread, index) => {
          const { chapter, products, category } = spread;
          const image = products[0]?.image ?? null;
          const isSplit = index % 2 === 1;

          return (
            <article key={chapter.index} className={`relative grid gap-8 lg:gap-14 ${isSplit ? "lg:grid-cols-[0.9fr_1.1fr]" : "lg:grid-cols-[1.15fr_0.85fr]"} lg:items-center`}>
              <div className={isSplit ? "lg:order-2" : ""}>
                <EditorialImageFrame
                  src={image}
                  alt={products[0]?.name ?? chapter.title}
                  theme={chapter.theme}
                  className={`${index % 3 === 2 ? "aspect-[4/5]" : "aspect-[3/4]"} w-full`}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  priority={index === 0}
                />
              </div>

              <div className={isSplit ? "lg:order-1" : ""}>
                <div className="flex items-center gap-5">
                  <span className="font-display text-6xl leading-none text-primary/20 sm:text-8xl">{chapter.index}</span>
                  <div>
                    <p className="text-[10px] tracking-[0.3em] text-primary/60">{chapter.englishTitle.toUpperCase()}</p>
                    <p className="mt-2 text-xs text-ink/50">{chapter.kicker}</p>
                  </div>
                </div>
                <h2 className="mt-6 text-balance text-3xl font-semibold sm:text-4xl">{chapter.title}</h2>
                <p className="mt-4 max-w-lg text-sm leading-8 text-ink/60">{chapter.body}</p>

                <blockquote className="mt-8 flex gap-3 border-r-2 border-primary/30 pr-4">
                  <Quote className="mt-1 h-4 w-4 shrink-0 text-primary/50" />
                  <p className="font-display text-lg italic leading-8 text-ink/70">{chapter.quote}</p>
                </blockquote>

                {products.length ? (
                  <div className="mt-8">
                    <p className="mb-2 text-[10px] tracking-[0.28em] text-ink/40">SHOP THE LOOK</p>
                    {products.slice(0, 3).map((product) => (
                      <ProductMiniLink key={product.id} name={product.name} href={`/product/${product.slug}`} price={`${formatToman(product.price)} تومان`} />
                    ))}
                  </div>
                ) : null}

                {category ? (
                  <Link href={`/category/${category.slug}`} className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:text-hover">
                    مشاهده کل {category.name} <ArrowLeft className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {gallery.length ? (
        <section className="container-luxury mt-24">
          <EditorialSectionTitle index="THE DETAILS" title="جزئیاتی که در قاب نمی‌گنجند" subtitle="بافت، افت و فرم؛ نزدیک‌تر به قطعه‌های این فصل." href="/shop" linkLabel="همهٔ محصولات" />
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {gallery.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`} className="group w-44 shrink-0 sm:w-56">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-line/20">
                  <EditorialImageFrame
                    src={product.image}
                    alt={product.name}
                    theme={lead?.chapter.theme ?? { from: "#E9DFD2", to: "#B9A38F", accent: "#5B4737", ink: "dark" }}
                    className="h-full rounded-2xl border-0"
                    sizes="220px"
                  />
                </div>
                <p className="mt-3 line-clamp-1 text-xs font-medium group-hover:text-primary">{product.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-luxury mt-24">
        <div className="relative overflow-hidden rounded-[36px] p-8 sm:p-14" style={themeBackground({ from: "#2E2925", to: "#5E4B3E", accent: "#E9DFD2", ink: "light" })}>
          <div aria-hidden className="absolute -left-10 -top-20 h-72 w-72 rounded-full border-[50px] border-white/5" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] tracking-[0.35em] text-white/50">NEXT CHAPTER</p>
              <h2 className="mt-4 text-balance text-3xl font-semibold text-white sm:text-5xl">فصل بعدی را با هم بسازیم.</h2>
              <p className="mt-4 max-w-xl text-sm leading-8 text-white/60">کالکشن‌ها را ببینید یا مستقیم سراغ تازه‌ها بروید. هر قطعه، یک قاب آماده برای روایت شماست.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/collections" size="lg" className="bg-white text-ink hover:bg-white/90">کالکشن‌ها</ButtonLink>
              <ButtonLink href="/new-arrivals" size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-ink">تازه‌ها</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <p className="container-luxury mt-10 text-center text-[11px] text-ink/35">
        عکس‌ها و استایل‌ها برای {site.name} تهیه شده‌اند. قطعه‌های نمایش‌داده‌شده تا زمان موجود بودن قابل خرید هستند.
      </p>
    </div>
  );
}
