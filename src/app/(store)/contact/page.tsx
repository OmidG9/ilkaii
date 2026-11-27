import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3, Mail, MapPin, MessageSquare, Phone, Ruler, Truck } from "lucide-react";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { ContactForm } from "@/components/contact-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "راه‌های ارتباط با پشتیبانی ilkaii؛ ایمیل، تلفن، آدرس و ساعات پاسخ‌گویی.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const site = await getSiteConfig();

  const channels = [
    { icon: Mail, label: "ایمیل", value: site.contact.email, href: `mailto:${site.contact.email}`, note: "پاسخ در یک روز کاری" },
    { icon: Phone, label: "تلفن", value: site.contact.phone, href: `tel:${site.contact.phone.replace(/[^+\d]/g, "")}`, note: "شنبه تا پنجشنبه، ۱۰ تا ۱۸" },
    { icon: MapPin, label: "آدرس", value: site.contact.address, href: undefined, note: "بازدید حضوری با هماهنگی" },
  ];

  return (
    <div className="pb-24">
      <div className="container-luxury pt-6">
        <Breadcrumbs items={[{ label: "تماس با ما" }]} />
      </div>

      <section className="container-luxury">
        <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="eyebrow">TALK TO US / SUPPORT</p>
            <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl">
              سلام،
              <br />
              <span className="font-display italic text-primary/45">در خدمتیم</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-ink/55">
              دربارهٔ سفارش، سایز، پارچه یا هر چیز دیگری بنویسید. پیام‌ها به دست انسان می‌رسند، نه ربات. هرچه دقیق‌تر بنویسید، سریع‌تر می‌توانیم کمک کنیم.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink/45">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-600" /></span>
            <div>
              <p className="font-medium text-ink/70">پشتیبانی فعال است</p>
              <p>میانگین پاسخ: کمتر از یک روز کاری</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-luxury mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <div className="rounded-[32px] border border-line bg-surface p-6 sm:p-9">
          <div className="mb-7 flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageSquare className="h-5 w-5" /></span>
            <div>
              <h2 className="text-lg font-semibold">پیام خود را بنویسید</h2>
              <p className="mt-1 text-xs leading-6 text-ink/50">فرم زیر پیام را در کلاینت ایمیل شما آماده می‌کند تا با یک کلیک ارسال شود.</p>
            </div>
          </div>
          <ContactForm email={site.contact.email} />
        </div>

        <aside className="space-y-4">
          {channels.map(({ icon: Icon, label, value, href, note }) => (
            <div key={label} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canvas text-primary"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <p className="text-[10px] tracking-[0.22em] text-ink/35">{label.toUpperCase()}</p>
                  {href ? (
                    <a href={href} dir={label === "تلفن" ? "ltr" : undefined} className="mt-1 block break-all text-sm font-medium hover:text-primary">{value}</a>
                  ) : (
                    <p className="mt-1 text-sm font-medium leading-6">{value}</p>
                  )}
                  <p className="mt-2 text-[11px] text-ink/40">{note}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4 text-primary" /> ساعات پاسخ‌گویی</div>
            <dl className="mt-4 space-y-2 text-xs text-ink/55">
              <div className="flex justify-between gap-3"><dt>شنبه تا چهارشنبه</dt><dd>۱۰:۰۰ – ۱۸:۰۰</dd></div>
              <div className="flex justify-between gap-3"><dt>پنجشنبه</dt><dd>۱۰:۰۰ – ۱۴:۰۰</dd></div>
              <div className="flex justify-between gap-3 text-ink/35"><dt>جمعه و تعطیلات</dt><dd>پاسخ روز کاری بعد</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-xs font-semibold">قبل از نوشتن</p>
            <div className="mt-3 space-y-2 text-xs text-ink/55">
              <Link href="/faq" className="flex items-center gap-2 hover:text-primary"><MessageSquare className="h-3.5 w-3.5" /> سؤالات متداول</Link>
              <Link href="/size-guide" className="flex items-center gap-2 hover:text-primary"><Ruler className="h-3.5 w-3.5" /> راهنمای سایز</Link>
              <Link href="/track" className="flex items-center gap-2 hover:text-primary"><Truck className="h-3.5 w-3.5" /> پیگیری سفارش</Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="container-luxury mt-16">
        <div className="flex flex-col gap-6 rounded-[32px] border border-line bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-12">
          <div>
            <p className="eyebrow">PREFER IN PERSON?</p>
            <h2 className="mt-3 text-2xl font-semibold">حضوری ببینید و پرو کنید</h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-ink/55">در تهران، اصفهان و شیراز میزبان شما هستیم. برای بازدید یا مشاورهٔ استایل، هماهنگی قبلی توصیه می‌شود.</p>
          </div>
          <ButtonLink href="/stores" variant="outline">آدرس فروشگاه‌ها <ArrowLeft className="h-4 w-4" /></ButtonLink>
        </div>
      </section>
    </div>
  );
}
