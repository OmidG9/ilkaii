import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { formatToman } from "@/lib/money";
import { formatNumber } from "@/lib/persian";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`surface-card ${className}`}>{children}</div>;
}

export function Badge({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "neutral" | "success" | "danger" }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    neutral: "bg-line text-ink/70",
    success: "bg-emerald-100 text-emerald-800",
    danger: "bg-red-100 text-red-700",
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function Price({ value, symbol = true, className = "" }: { value: number; symbol?: boolean; className?: string }) {
  return <span dir="ltr" className={`inline-block font-semibold tabular-nums ${className}`}>{formatToman(value, symbol)}</span>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full rounded-luxury" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-luxury border border-dashed border-line bg-surface/60 p-8 text-center">
      <div className="text-4xl" aria-hidden>✦</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-md text-sm text-ink/60">{description}</p> : null}
      {action}
    </div>
  );
}

export function Alert({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "success" }) {
  const tones = {
    info: "border-primary/30 bg-primary/5 text-ink",
    error: "border-red-300 bg-red-50 text-red-800",
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  };
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-2xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function SectionTitle({ title, subtitle, href, linkLabel }: {
  title: string; subtitle?: string; href?: string; linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-ink/60">{subtitle}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:text-hover">
          {linkLabel}<ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function Pagination({ page, pageCount, pathname, params = {} }: {
  page: number; pageCount: number; pathname: string; params?: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;
  const link = (p: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    search.set("page", String(p));
    return `${pathname}?${search.toString()}`;
  };
  return (
    <nav aria-label="صفحات" className="mt-10 flex items-center justify-center gap-2">
      {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((p) => (
        <Link
          key={p}
          href={link(p)}
          aria-current={p === page ? "page" : undefined}
          className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm ${p === page ? "border-primary bg-primary text-white" : "border-line bg-surface hover:border-primary"}`}
        >
          {formatNumber(p)}
        </Link>
      ))}
    </nav>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="مسیر" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-ink/60">
      <Link href="/" className="hover:text-primary">خانه</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <ChevronLeft className="h-3 w-3" />
          {item.href ? <Link href={item.href} className="hover:text-primary">{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
