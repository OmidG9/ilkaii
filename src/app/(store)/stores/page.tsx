import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Clock3, MapPin, Phone, Ruler, ShoppingBag } from "lucide-react";
import { storeLocations } from "@/config/editorial";
import { getSiteConfig } from "@/config/site";
import { JsonLd } from "@/components/json-ld";
import { ButtonLink } from "@/components/ui/button";
import { Marquee, Stat } from "@/components/editorial";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "فروشگاه‌های حضوری",
  description: "آدرس، ساعات کاری و اطلاعات تماس بوتیک‌های حضوری ilkaii در تهران، اصفهان و شیراز.",
  alternates: { canonical: "/stores" },
};

const pins = [
  { city: "تهران", top: "22%", right: "34%", delay: "0s" },
  { city: "اصفهان", top: "48%", right: "48%", delay: "0.6s" },
  { city: "شیراز", top: "70%", right: "58%", delay: "1.2s" },
];

export default async function StoresPage() {
  const site = await getSiteConfig();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: storeLocations.map((store, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Store",
        name: `ilkaii — ${store.name}`,
        address: { "@type": "PostalAddress", addressLocality: store.city, streetAddress: store.address, addressCountry: "IR" },
        telephone: store.phone,
        openingHours: store.hours,
      },
    })),
  };

  return (
    <div className="pb-24">
      <JsonLd data={structuredData} />

      <section className="container-luxury pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:p-16">
            <div className="max-w-xl">
              <p className="eyebrow">PHYSICAL SPACES / IRAN</p>
              <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl">
                حضوری
                <br />
                <span className="font-display italic text-primary/40">ببینید</span>
              </h1>
              <p className="mt-6 text-sm leading-8 text-ink/55">
                پارچه را لمس کنید، پرو کنید و با آرامش انتخاب کنید. بوتیک‌های ما کوچک‌اند تا هر قطعه فضای کافی برای دیده شدن داشته باشد.
              </p>
              <div className="mt-8 flex flex-wrap gap-8">
                <Stat value={storeLocations.length} label="شهر" />
                <Stat value="۷" label="روز هفته پاسخ‌گویی" />
                <Stat value="۰" label="عجله" />
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#locations" size="lg">آدرس‌ها</ButtonLink>
                <ButtonLink href="/contact" size="lg" variant="outline">هماهنگی بازدید</ButtonLink>
              </div>
            </div>

            <div className="relative aspect-square overflow-hidden rounded-[32px] border border-line bg-[#2A2521]">
              <div className="editorial-grid absolute inset-0 opacity-[0.16]" aria-hidden />
              <div aria-hidden className="absolute left-[12%] top-[30%] h-px w-[76%] rotate-[28deg] bg-white/15" />
              <div aria-hidden className="absolute left-[28%] top-[62%] h-[52%] w-px -rotate-[22deg] bg-white/15" />
              <div aria-hidden className="absolute right-[20%] top-[18%] h-[58%] w-px rotate-[12deg] bg-white/10" />
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_65%)]" />
              {pins.map((pin) => (
                <div key={pin.city} className="absolute" style={{ top: pin.top, right: pin.right }}>
                  <span className="absolute -right-1.5 -top-1.5 h-3 w-3 animate-ping rounded-full bg-[#D9C5B2]/50" style={{ animationDelay: pin.delay }} />
                  <span className="relative block h-2.5 w-2.5 rounded-full border border-white/60 bg-[#D9C5B2]" />
                  <span className="mt-2 block whitespace-nowrap rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[10px] text-white/80 backdrop-blur">{pin.city}</span>
                </div>
              ))}
              <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[10px] text-white/55 backdrop-blur">
                <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> نقشهٔ شماتیک از موقعیت بوتیک‌ها</span>
                <span>ILKAII / ۱۴۰۴</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee className="mt-8" items={["TEHRAN", "ISFAHAN", "SHIRAZ", "COME SAY HI", "لمس کنید، پرو کنید", "SMALL SPACES, GOOD LIGHT"]} />

      <section id="locations" className="container-luxury mt-16 scroll-mt-28">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="eyebrow">THE BOUTIQUES</p>
            <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">سه فضا، سه شهر</h2>
          </div>
          <p className="max-w-md text-xs leading-6 text-ink/45">برای بازدیدهای گروهی یا مشاورهٔ استایل، لطفاً از قبل هماهنگ کنید تا وقت کافی داشته باشیم.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {storeLocations.map((store, index) => (
            <article key={store.city} className="group relative flex flex-col justify-between overflow-hidden rounded-[30px] border border-line bg-surface p-7">
              <span aria-hidden className="absolute -left-3 top-4 font-display text-[90px] leading-none text-primary/[0.06]">{["۰۱", "۰۲", "۰۳"][index]}</span>
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-line bg-canvas px-3 py-1 text-[10px] text-ink/50">{store.city}</span>
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: store.accent }} aria-hidden />
                </div>
                <h3 className="mt-6 text-2xl font-semibold">{store.name}</h3>
                <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-ink/55"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" /> {store.address}</p>
                <p className="mt-3 flex items-center gap-2 text-xs text-ink/55"><Clock3 className="h-4 w-4 text-primary/60" /> {store.hours}</p>
                <p className="mt-3 flex items-center gap-2 text-xs text-ink/55"><Phone className="h-4 w-4 text-primary/60" /> <a href={`tel:${store.phone.replace(/[^+\d]/g, "")}`} dir="ltr" className="hover:text-primary">{store.phone}</a></p>
                <p className="mt-5 rounded-2xl bg-canvas px-4 py-3 text-[11px] leading-5 text-ink/45">{store.note}</p>
              </div>
              <Link href="/contact" className="relative mt-7 inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-hover">
                هماهنگی بازدید <CalendarCheck className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="container-luxury mt-20 grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShoppingBag, title: "تحویل حضوری سفارش", text: "سفارش آنلاین را می‌توانید در بوتیک تحویل بگیرید و همان‌جا پرو کنید." },
          { icon: Ruler, title: "اصلاحات کوچک", text: "برای تنظیمات سادهٔ قد و آستین، راهنمایی می‌کنیم یا به خیاط همکار معرفی می‌کنیم." },
          { icon: CalendarCheck, title: "مشاورهٔ اختصاصی", text: "برای استایل خاص، عروسی یا هدیه، وقت اختصاصی هماهنگ کنید." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-line bg-surface p-6">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="mt-4 text-sm font-semibold">{title}</h2>
            <p className="mt-2 text-xs leading-6 text-ink/55">{text}</p>
          </div>
        ))}
      </section>

      <section className="container-luxury mt-20">
        <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">BEFORE YOU VISIT</p>
            <h2 className="mt-3 text-2xl font-semibold">چیزی را رزرو کنید؟</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-ink/55">اگر قطعهٔ خاصی را در نظر دارید، قبل از مراجعه با {site.contact.phone} هماهنگ کنید تا آن را برایتان نگه داریم.</p>
          </div>
          <ButtonLink href="/contact" size="lg">تماس با پشتیبانی</ButtonLink>
        </div>
      </section>
    </div>
  );
}
