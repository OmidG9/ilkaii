import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LifeBuoy, MessageCircle, PackageSearch, Ruler, Truck } from "lucide-react";
import { faqGroups } from "@/config/editorial";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "سؤالات متداول",
  description: "پاسخ سؤالات پرتکرار دربارهٔ سفارش، ارسال، بازگشت، سایز و حساب کاربری در ilkaii.",
  alternates: { canonical: "/faq" },
};

const groupIcons = {
  orders: PackageSearch,
  shipping: Truck,
  returns: ArrowLeft,
  sizing: Ruler,
  account: LifeBuoy,
  care: MessageCircle,
} as const;

export default function FaqPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqGroups.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    ),
  };

  return (
    <div className="pb-24">
      <JsonLd data={structuredData} />

      <section className="container-luxury pt-8 sm:pt-14">
        <div className="grid gap-10 border-b border-line pb-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div className="relative">
            <p className="eyebrow">HELP CENTER / FAQ</p>
            <p aria-hidden className="mt-4 font-display text-[130px] leading-[0.7] text-primary/10 sm:text-[190px]">?</p>
          </div>
          <div>
            <h1 className="text-balance text-5xl font-semibold leading-[1.05] sm:text-7xl">
              هر سؤالی
              <br />
              <span className="font-display italic text-primary/45">جواب دارد</span>
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-8 text-ink/55">
              قبل از تماس با پشتیبانی، اینجا را ببینید. پاسخ‌ها بر اساس رویهٔ واقعی فروشگاه نوشته شده‌اند؛ اگر چیزی پیدا نکردید، خوشحال می‌شویم کمک کنیم.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {faqGroups.map((group) => (
                <a key={group.id} href={`#${group.id}`} className="rounded-full border border-line bg-surface px-4 py-2 text-xs text-ink/55 hover:border-primary hover:text-primary">
                  {group.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-luxury mt-12 grid gap-10 lg:grid-cols-[240px_1fr] lg:items-start">
        <aside className="hidden lg:sticky lg:top-28 lg:block">
          <p className="mb-4 text-[10px] tracking-[0.28em] text-ink/40">موضوع‌ها</p>
          <nav aria-label="موضوع‌های سؤالات متداول" className="space-y-1">
            {faqGroups.map((group, index) => {
              const Icon = groupIcons[group.id as keyof typeof groupIcons] ?? MessageCircle;
              return (
                <a key={group.id} href={`#${group.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink/60 transition-colors hover:bg-surface hover:text-primary">
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{group.title}</span>
                  <span className="text-[10px] text-ink/30">{["۰۱", "۰۲", "۰۳", "۰۴", "۰۵", "۰۶"][index]}</span>
                </a>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">جواب پیدا نکردید؟</h2>
            <p className="mt-2 text-xs leading-6 text-ink/50">تیم پشتیبانی در ساعات کاری پاسخ می‌دهد.</p>
            <ButtonLink href="/contact" size="sm" className="mt-4 w-full">تماس با ما</ButtonLink>
          </div>
        </aside>

        <div className="divide-y divide-line border-t border-line">
          {faqGroups.map((group, index) => {
            const Icon = groupIcons[group.id as keyof typeof groupIcons] ?? MessageCircle;
            return (
              <section key={group.id} id={group.id} className="scroll-mt-28 py-10">
                <div className="mb-6 flex items-start gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-[10px] tracking-[0.28em] text-ink/35">{["۰۱", "۰۲", "۰۳", "۰۴", "۰۵", "۰۶"][index]}</p>
                    <h2 className="mt-1 text-xl font-semibold sm:text-2xl">{group.title}</h2>
                    <p className="mt-1 text-xs text-ink/45">{group.description}</p>
                  </div>
                </div>
                <FaqAccordion items={group.items} defaultOpen={index === 0 ? 0 : -1} />
              </section>
            );
          })}
        </div>
      </section>

      <section className="container-luxury mt-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { href: "/size-guide", title: "راهنمای سایز", text: "اندازه‌ها، جدول و نکات انتخاب" },
            { href: "/policies/shipping", title: "ارسال و تحویل", text: "زمان، هزینه و پیگیری" },
            { href: "/policies/returns", title: "بازگشت کالا", text: "شرایط و مراحل مرجوعی" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-primary">
              <h2 className="text-sm font-semibold group-hover:text-primary">{item.title}</h2>
              <p className="mt-2 text-xs leading-6 text-ink/50">{item.text}</p>
              <ArrowLeft className="mt-5 h-4 w-4 text-primary/50 transition-transform group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
