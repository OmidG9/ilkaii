import type { Metadata } from "next";
import { ArrowLeft, Heart, Leaf, Scissors, Sparkles } from "lucide-react";
import { getSiteConfig } from "@/config/site";
import { brandValues } from "@/config/editorial";
import { getEditorialPicks } from "@/services/storefront";
import { Breadcrumbs } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { EditorialImageFrame, Marquee, Stat, themeBackground } from "@/components/editorial";
import { formatJalali, formatNumber } from "@/lib/persian";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "دربارهٔ ما", description: site.content.about, alternates: { canonical: "/about" } };
}

const heroTheme = { from: "#E9DFD2", to: "#B9A38F", accent: "#5B4737", ink: "dark" as const };

export default async function AboutPage() {
  const [site, picks] = await Promise.all([getSiteConfig(), getEditorialPicks(1).catch(() => [])]);
  const cover = picks[0];

  return (
    <div className="pb-24">
      <div className="container-luxury pt-6">
        <Breadcrumbs items={[{ label: "دربارهٔ ما" }]} />
      </div>

      <section className="container-luxury">
        <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface">
          <div aria-hidden className="grain absolute inset-0 opacity-60" />
          <div className="relative grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-16">
            <div className="max-w-2xl">
              <p className="eyebrow">OUR STORY / SINCE ۱۳۹۸</p>
              <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.03] sm:text-7xl">
                لباسی برای
                <br />
                <span className="font-display italic text-primary/45">زندگی واقعی</span>
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-8 text-ink/60">{site.content.about}</p>
              <p className="mt-4 max-w-xl text-sm leading-8 text-ink/45">
                ما با یک سؤال ساده شروع کردیم: چرا بیشتر لباس‌ها در کمد می‌مانند؟ پاسخ، در جزئیات بود؛ در پارچه، در تناسب و در این‌که یک قطعه باید با چند موقعیت زندگی کند.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/collections" size="lg">دیدن کالکشن‌ها</ButtonLink>
                <ButtonLink href="/lookbook" size="lg" variant="outline">لوک‌بوک فصل</ButtonLink>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <EditorialImageFrame
                src={cover?.image}
                alt={cover?.name ?? "ilkaii"}
                theme={heroTheme}
                className="aspect-[4/5] rotate-[1.5deg] shadow-2xl"
                sizes="(max-width: 1024px) 80vw, 35vw"
                priority
              />
              <div className="absolute -bottom-6 -right-4 rounded-2xl border border-line bg-surface/90 px-5 py-4 text-ink shadow-soft backdrop-blur">
                <p className="font-display text-2xl text-primary">{site.name}</p>
                <p className="mt-1 text-[10px] text-ink/45">طراحی در ایران / تولید محدود</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee
        className="mt-8"
        items={["DESIGNED IN IRAN", "SMALL BATCH", "QUALITY OVER QUANTITY", "از ۱۳۹۸", "MADE TO BE WORN"]}
      />

      <section className="container-luxury mt-14 grid gap-8 border-b border-line pb-10 sm:grid-cols-2 lg:grid-cols-4">
        <Stat value="۱۳۹۸" label="سال شروع" />
        <Stat value="۵" label="کالکشن فصلی" />
        <Stat value={formatNumber(3)} label="شهر با فضای حضوری" />
        <Stat value="∞" label="بار پوشیدن، هدف ما" />
      </section>

      <section className="container-luxury mt-20 grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">OUR PRINCIPLES</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">چهار چیزی که تغییر نمی‌کند</h2>
          <p className="mt-5 text-sm leading-8 text-ink/55">
            این اصول در انتخاب پارچه، طراحی و حتی بسته‌بندی اعمال می‌شوند. اگر قطعه‌ای با آن‌ها هم‌خوان نباشد، وارد مجموعه نمی‌شود.
          </p>
          <ButtonLink href="/sustainability" variant="outline" className="mt-7">بیشتر دربارهٔ پایداری <ArrowLeft className="h-4 w-4" /></ButtonLink>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {brandValues.map((value, index) => {
            const icons = [Scissors, Leaf, Sparkles, Heart];
            const Icon = icons[index] ?? Sparkles;
            return (
              <article key={value.title} className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6">
                <span aria-hidden className="absolute -left-2 -top-4 font-display text-7xl text-primary/[0.06]">{["۰۱", "۰۲", "۰۳", "۰۴"][index]}</span>
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="relative mt-5 text-lg font-semibold">{value.title}</h3>
                <p className="relative mt-2 text-xs leading-7 text-ink/55">{value.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-luxury mt-24">
        <div className="rounded-[32px] border border-line bg-surface p-8 sm:p-12">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
            <div>
              <p className="eyebrow">THE TIMELINE</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">چطور به اینجا رسیدیم</h2>
            </div>
            <p className="text-xs text-ink/40">امروز: {formatJalali(new Date())}</p>
          </div>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { year: "۱۳۹۸", title: "اتاق کوچک", text: "با چند قطعهٔ محدود و یک دفتر طراحی، ilkaii شروع شد." },
              { year: "۱۴۰۰", title: "اولین کالکشن", text: "مجموعهٔ اول با تمرکز بر هودی و شلوار آزاد منتشر شد." },
              { year: "۱۴۰۲", title: "فضای حضوری", text: "اولین بوتیک در تهران؛ فضایی برای لمس پارچه و پرو." },
              { year: "۱۴۰۴", title: "پنج کالکشن", text: "کمدی آرام از پیراهن تا ورزشی، با تولید محدود." },
            ].map((step, index) => (
              <li key={step.year} className="relative border-r border-line pr-5 first:border-0 first:pr-0">
                <span className="font-display text-3xl text-primary/30">{step.year}</span>
                <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
                <p className="mt-2 text-xs leading-6 text-ink/50">{step.text}</p>
                {index < 3 ? <span className="absolute -right-1 top-2 hidden h-2 w-2 rounded-full bg-primary/40 lg:block" /> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-luxury mt-20">
        <div className="grid gap-6 overflow-hidden rounded-[36px] p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-end" style={themeBackground({ from: "#2E2925", to: "#5E4B3E", accent: "#E9DFD2", ink: "light" })}>
          <div>
            <p className="text-[10px] tracking-[0.32em] text-white/45">COME CLOSER</p>
            <h2 className="mt-4 text-balance text-3xl font-semibold text-white sm:text-4xl">داستان بعدی، با شما نوشته می‌شود.</h2>
            <p className="mt-3 max-w-xl text-sm leading-8 text-white/55">کالکشن‌ها را ببینید، حضوری سر بزنید یا فقط سلام کنید. ما به بازخورد واقعی نیاز داریم.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/stores" className="bg-white text-ink hover:bg-white/90">فروشگاه‌ها</ButtonLink>
            <ButtonLink href="/contact" variant="outline" className="border-white/30 text-white hover:bg-white hover:text-ink">تماس</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
