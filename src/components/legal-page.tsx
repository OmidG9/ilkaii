import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, LifeBuoy, Scale, ShieldCheck, Truck, Undo2 } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";

const policyLinks = [
  { href: "/policies/shipping", label: "ارسال و تحویل", icon: Truck },
  { href: "/policies/returns", label: "بازگشت کالا", icon: Undo2 },
  { href: "/privacy", label: "حریم خصوصی", icon: ShieldCheck },
  { href: "/terms", label: "شرایط و قوانین", icon: Scale },
];

export function LegalPage({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  aside,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="container-luxury py-10 sm:py-14">
      <Breadcrumbs items={[{ label: title }]} />

      <header className="relative overflow-hidden rounded-[32px] border border-line bg-surface p-8 sm:p-12">
        <div aria-hidden className="grain absolute inset-0 opacity-50" />
        <span aria-hidden className="pointer-events-none absolute -left-6 -top-8 font-display text-[160px] leading-none text-primary/[0.06]">§</span>
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold sm:text-5xl">{title}</h1>
            {description ? <p className="mt-4 max-w-xl text-sm leading-8 text-ink/55">{description}</p> : null}
          </div>
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-canvas text-primary">
            <Icon className="h-7 w-7" />
          </span>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-28">
          <nav aria-label="صفحات قوانین" className="rounded-2xl border border-line bg-surface p-3">
            <p className="px-3 pb-2 pt-1 text-[10px] tracking-[0.24em] text-ink/35">POLICIES</p>
            {policyLinks.map((link) => {
              const LinkIcon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs text-ink/60 transition-colors hover:bg-canvas hover:text-primary">
                  <LinkIcon className="h-4 w-4" /> {link.label}
                </Link>
              );
            })}
          </nav>

          {aside}

          <div className="rounded-2xl border border-line bg-surface p-5">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">سؤالی دارید؟</h2>
            <p className="mt-2 text-xs leading-6 text-ink/50">اگر پاسخ خود را پیدا نکردید، پشتیبانی در ساعات کاری پاسخ می‌دهد.</p>
            <ButtonLink href="/contact" variant="outline" size="sm" className="mt-4 w-full">تماس با ما</ButtonLink>
          </div>

          <Link href="/faq" className="inline-flex items-center gap-1 px-2 text-xs text-ink/45 hover:text-primary">
            سؤالات متداول <ArrowLeft className="h-3 w-3" />
          </Link>
        </aside>

        <article className="rounded-[28px] border border-line bg-surface p-6 sm:p-9">
          <div className="space-y-8 text-sm leading-8 text-ink/70">{children}</div>
        </article>
      </div>
    </div>
  );
}
