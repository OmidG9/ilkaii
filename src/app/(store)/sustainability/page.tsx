import type { Metadata } from "next";
import { ArrowLeft, Leaf, Recycle, ShieldCheck, Sparkles } from "lucide-react";
import { brandValues, sustainabilityPillars } from "@/config/editorial";
import { ButtonLink } from "@/components/ui/button";
import { EditorialSectionTitle, Marquee, Stat, themeBackground } from "@/components/editorial";

export const metadata: Metadata = {
  title: "پایداری و ساخت",
  description: "رویکرد ilkaii به تولید محدود، پارچهٔ بادوام و شفافیت در ساخت پوشاک.",
  alternates: { canonical: "/sustainability" },
};

const darkTheme = { from: "#1F1C19", to: "#3D342D", accent: "#D9C5B2", ink: "light" as const };

export default function SustainabilityPage() {
  return (
    <div className="pb-24">
      <section className="container-luxury pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-[36px] p-8 sm:p-14 lg:p-20" style={themeBackground(darkTheme)}>
          <div aria-hidden className="absolute -left-24 -top-24 h-80 w-80 rounded-full border-[60px] border-white/5" />
          <div aria-hidden className="absolute -bottom-28 right-0 h-96 w-96 rounded-full border border-white/10" />
          <div className="relative max-w-4xl">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-white/45">MAKING / SUSTAINABILITY</p>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.1] text-white sm:text-6xl lg:text-7xl">
              لباس کمتر،
              <br />
              <span className="font-display italic text-white/45">فکر بیشتر.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-8 text-white/60">
              پایداری برای ما یک کمپین فصلی نیست؛ یک محدودیت طراحی است. اگر نتوانیم قطعه‌ای بسازیم که سال‌ها پوشیده شود، آن را نمی‌سازیم. این صفحه، آنچه انجام می‌دهیم و آنچه هنوز باید بهتر شود را توضیح می‌دهد.
            </p>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/10 pt-7">
              <Stat value="۵" label="کالکشن محدود" light />
              <Stat value="۰" label="تولید انبوه" light />
              <Stat value="۱۰۰٪" label="تلاش برای شفافیت" light />
            </div>
          </div>
        </div>
      </section>

      <Marquee
        className="mt-8"
        invert
        items={["BUY LESS, CHOOSE BETTER", "SMALL BATCH", "LONGER LIFE", "کمتر بخرید، بهتر بپوشید", "DESIGNED IN IRAN"]}
      />

      <section className="container-luxury mt-20 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="eyebrow">THE MANIFESTO</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight sm:text-4xl">
            ما ادعا نمی‌کنیم کامل هستیم. ادعا می‌کنیم دقیق‌تر از دیروز هستیم.
          </h2>
          <p className="mt-6 text-sm leading-8 text-ink/55">
            تولید پوشاک همیشه اثر دارد. انتخاب ما این است که اثر را کم کنیم: تیراژ کوچک‌تر، پارچهٔ بادوام‌تر، بسته‌بندی ساده‌تر و ارتباط مستقیم‌تر با کسانی که می‌پوشند.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[11px] text-ink/55"><Leaf className="h-3.5 w-3.5 text-primary" /> طراحی مینیمال</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[11px] text-ink/55"><Recycle className="h-3.5 w-3.5 text-primary" /> بسته‌بندی ساده</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-[11px] text-ink/55"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> قیمت شفاف</span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {brandValues.map((value, index) => (
            <article key={value.title} className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6">
              <span aria-hidden className="absolute -left-2 -top-4 font-display text-7xl text-primary/[0.06]">{["۰۱", "۰۲", "۰۳", "۰۴"][index]}</span>
              <h3 className="relative text-lg font-semibold">{value.title}</h3>
              <p className="relative mt-3 text-xs leading-7 text-ink/55">{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-luxury mt-24">
        <EditorialSectionTitle
          index="THE PRINCIPLES"
          title="چهار تصمیم، هر روز"
          subtitle="این‌ها شعار نیستند؛ محدودیت‌هایی هستند که در انتخاب پارچه، تیراژ و بسته‌بندی اعمال می‌شوند."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          {sustainabilityPillars.map((pillar) => (
            <article key={pillar.index} className="group rounded-[28px] border border-line bg-surface p-7 transition-colors hover:border-primary/40">
              <div className="flex items-start justify-between gap-4">
                <p className="font-display text-4xl text-primary/25">{pillar.index}</p>
                <Sparkles className="h-5 w-5 text-primary/25 transition-colors group-hover:text-primary/60" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-8 text-ink/55">{pillar.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-luxury mt-24 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[32px] border border-line bg-surface p-8">
          <p className="eyebrow">WHAT WE DON&apos;T DO</p>
          <h2 className="mt-4 text-2xl font-semibold">چیزهایی که عمداً انجام نمی‌دهیم</h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-ink/60">
            {[
              "تخفیف‌های مصنوعی با قیمت خط‌خوردهٔ ساختگی",
              "تولید انبوه برای رسیدن به فروش بیشتر",
              "کمپین‌های پایداری بدون تغییر واقعی در فرآیند",
              "پنهان کردن ترکیب پارچه یا محل تولید",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[32px] p-8" style={themeBackground({ from: "#E9DFD2", to: "#C7B4A0", accent: "#5B4737", ink: "dark" })}>
          <p className="eyebrow">WHAT&apos;S NEXT</p>
          <h2 className="mt-4 text-2xl font-semibold">در حال بهتر شدن</h2>
          <p className="mt-4 text-sm leading-8 opacity-70">
            در حال ساخت مسیر بازگشت و ترمیم قطعه‌ها هستیم تا عمر لباس‌ها بیشتر شود. همچنین در حال بررسی پارچه‌های بازیافتی با کیفیت قابل قبول هستیم؛ تا زمانی که کیفیت تأیید نشود، وارد مجموعه نمی‌شوند.
          </p>
          <ButtonLink href="/contact" variant="outline" className="mt-6 border-current text-current hover:bg-current/10">پیشنهاد یا سؤال</ButtonLink>
        </div>
      </section>

      <section className="container-luxury mt-20">
        <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">SHOP WITH INTENTION</p>
            <h2 className="mt-3 text-2xl font-semibold">قطعه‌ای بخرید که واقعاً بپوشید</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-ink/55">کالکشن‌ها را ببینید یا برای انتخاب دقیق‌تر، از مشاورهٔ سایز کمک بگیرید.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/collections">کالکشن‌ها</ButtonLink>
            <ButtonLink href="/about" variant="outline">دربارهٔ ما <ArrowLeft className="h-4 w-4" /></ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
