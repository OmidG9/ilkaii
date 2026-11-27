import Link from "next/link";
import { ArrowLeft, Instagram, Mail, MapPin, Phone, Send, ShieldCheck, Truck } from "lucide-react";
import type { SiteConfig } from "@/config/site";
import type { StoreMenuItem } from "@/lib/navigation";
import { formatNumber } from "@/lib/persian";
import { NewsletterForm } from "@/components/newsletter-form";

function flattenMenu(items: StoreMenuItem[], depth = 0): Array<StoreMenuItem & { depth: number }> {
  return items.flatMap((item) => [{ ...item, depth }, ...flattenMenu(item.children, depth + 1)]);
}

const shopLinks = [
  { href: "/shop", label: "همهٔ محصولات" },
  { href: "/new-arrivals", label: "تازه‌ها" },
  { href: "/collections", label: "کالکشن‌ها" },
  { href: "/sale", label: "حراج فصل" },
  { href: "/lookbook", label: "لوک‌بوک" },
  { href: "/brands", label: "برندها" },
];

const helpLinks = [
  { href: "/size-guide", label: "راهنمای سایز" },
  { href: "/faq", label: "سؤالات متداول" },
  { href: "/policies/shipping", label: "ارسال و تحویل" },
  { href: "/policies/returns", label: "بازگشت کالا" },
  { href: "/account/returns/new", label: "ثبت درخواست مرجوعی" },
  { href: "/track", label: "پیگیری سفارش" },
  { href: "/blog", label: "ژورنال" },
];

const aboutLinks = [
  { href: "/about", label: "داستان برند" },
  { href: "/sustainability", label: "پایداری و ساخت" },
  { href: "/stores", label: "فروشگاه‌های حضوری" },
  { href: "/contact", label: "تماس با ما" },
  { href: "/privacy", label: "حریم خصوصی" },
  { href: "/terms", label: "شرایط و قوانین" },
];

export function Footer({ site, menu }: { site: SiteConfig; menu?: StoreMenuItem[] }) {
  const menuItems = menu?.length ? flattenMenu(menu).slice(0, 8) : [];
  const shopColumn = menuItems.length
    ? menuItems.map((item) => ({ href: item.href, label: item.label }))
    : shopLinks;

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-luxury py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href="/" className="font-display text-3xl font-bold tracking-tight text-primary">{site.name}</Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-ink/55">{site.tagline}</p>
            <div className="mt-6 flex flex-wrap gap-2 text-[10px] text-ink/45">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5"><Truck className="h-3.5 w-3.5 text-primary" /> ارسال سراسر کشور</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> پرداخت امن</span>
            </div>
            {site.features.newsletter ? (
              <div className="mt-7 max-w-sm">
                <p className="text-xs font-semibold">خبرنامهٔ آرام ilkaii</p>
                <p className="mt-1 text-[11px] leading-5 text-ink/40">مجموعهٔ بعدی، بدون ایمیل اضافه. فقط وقتی چیز تازه‌ای داریم.</p>
                <NewsletterForm compact />
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">فروشگاه</h3>
            <ul className="space-y-3 text-sm text-ink/60">
              {shopColumn.map((item, index) => (
                <li key={`${item.href}-${index}`}>
                  <Link className="link-underline hover:text-primary" href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">راهنما</h3>
            <ul className="space-y-3 text-sm text-ink/60">
              {helpLinks.map((item) => (
                <li key={item.href}>
                  <Link className="link-underline hover:text-primary" href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">درباره و ارتباط</h3>
            <ul className="space-y-3 text-sm text-ink/60">
              {aboutLinks.map((item) => (
                <li key={item.href}>
                  <Link className="link-underline hover:text-primary" href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3 border-t border-line pt-5 text-xs text-ink/50">
              <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-3.5 w-3.5" /> {site.contact.email}</a>
              <a href={`tel:${site.contact.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-3.5 w-3.5" /> <span dir="ltr">{site.contact.phone}</span></a>
              <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {site.contact.address}</p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[11px] text-ink/40">
          <p>© {formatNumber(new Date().getFullYear())} {site.name} — تمامی حقوق محفوظ است.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>قیمت‌ها به تومان</span>
            <span className="h-3 w-px bg-line" />
            <Link href="/faq" className="inline-flex items-center gap-1 hover:text-primary">پرسش‌های متداول <ArrowLeft className="h-3 w-3" /></Link>
            <span className="h-3 w-px bg-line" />
            <span className="inline-flex items-center gap-1.5"><Instagram className="h-3.5 w-3.5" /> ilkaii@</span>
          </div>
        </div>
        <p className="mt-4 text-[10px] text-ink/25">طراحی‌شده برای پوشیدن، نه فقط دیدن. <Send className="mr-1 inline h-3 w-3" /></p>
      </div>
    </footer>
  );
}
