import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";
import type { CollectionTheme } from "@/config/editorial";
import { SafeImage } from "@/components/safe-image";
import { formatNumber } from "@/lib/persian";

export function themeBackground(theme: CollectionTheme): CSSProperties {
  return {
    background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
    color: theme.ink === "light" ? "#f8f5f1" : "#292420",
  };
}

export function themeTextColor(theme: CollectionTheme) {
  return theme.ink === "light" ? "text-white" : "text-ink";
}

export function Marquee({
  items,
  className = "",
  invert = false,
}: {
  items: string[];
  className?: string;
  invert?: boolean;
}) {
  if (!items.length) return null;
  const repeated = Array.from({ length: 4 }, () => items).flat();
  return (
    <div
      aria-hidden
      className={`overflow-hidden border-y ${invert ? "border-white/15 bg-ink text-canvas" : "border-line bg-surface text-ink"} ${className}`}
    >
      <div dir="ltr" className="marquee-track flex w-max items-center gap-10 py-3">
        {repeated.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-10 whitespace-nowrap text-[11px] font-medium tracking-[0.24em]">
            {item}
            <span className="inline-block h-1 w-1 rounded-full bg-current opacity-50" />
          </span>
        ))}
      </div>
    </div>
  );
}

export function EditorialHero({
  eyebrow,
  title,
  description,
  theme,
  aside,
  children,
  size = "default",
  align = "start",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  theme?: CollectionTheme;
  aside?: ReactNode;
  children?: ReactNode;
  size?: "default" | "grand";
  align?: "start" | "center";
  className?: string;
}) {
  const style = theme ? themeBackground(theme) : undefined;
  return (
    <section className={`container-luxury ${className}`}>
      <div
        className={`relative overflow-hidden rounded-[36px] border border-line/40 ${
          size === "grand" ? "min-h-[480px] sm:min-h-[560px]" : "min-h-[380px]"
        } ${align === "center" ? "text-center" : ""}`}
        style={style}
      >
        <div aria-hidden className="absolute -left-24 -top-28 h-80 w-80 rounded-full border-[60px] border-current opacity-[0.06]" />
        <div aria-hidden className="absolute -bottom-32 right-10 h-96 w-96 rounded-full border border-current opacity-[0.12]" />
        <div className={`relative grid gap-10 p-8 sm:p-12 lg:p-16 ${aside ? "lg:grid-cols-[1.1fr_0.9fr] lg:items-center" : ""}`}>
          <div className={`max-w-3xl space-y-6 ${align === "center" ? "mx-auto" : ""}`}>
            {eyebrow ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] opacity-70">{eyebrow}</p>
            ) : null}
            <h1 className={`text-balance font-semibold leading-[1.12] ${size === "grand" ? "text-4xl sm:text-6xl lg:text-7xl" : "text-3xl sm:text-5xl"}`}>
              {title}
            </h1>
            {description ? <p className="max-w-xl text-sm leading-8 opacity-75 sm:text-base">{description}</p> : null}
            {children ? <div className={`flex flex-wrap items-center gap-3 pt-2 ${align === "center" ? "justify-center" : ""}`}>{children}</div> : null}
          </div>
          {aside ? <div className="relative">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function EditorialImageFrame({
  src,
  alt,
  theme,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  theme: CollectionTheme;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-luxury border border-line/30 ${className}`} style={themeBackground(theme)}>
      {src ? (
        <SafeImage src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" fallbackLabel={alt} />
      ) : (
        <div className="flex h-full min-h-64 items-center justify-center p-8">
          <span className="text-center font-display text-4xl leading-tight opacity-40">{alt}</span>
        </div>
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
    </div>
  );
}

export function EditorialSectionTitle({
  index,
  title,
  subtitle,
  href,
  linkLabel,
  light = false,
}: {
  index?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        {index ? (
          <p className={`mb-3 text-[11px] tracking-[0.35em] ${light ? "text-white/50" : "text-primary/60"}`}>{index}</p>
        ) : null}
        <h2 className={`text-balance text-2xl font-semibold sm:text-4xl ${light ? "text-white" : ""}`}>{title}</h2>
        {subtitle ? <p className={`mt-3 text-sm leading-7 ${light ? "text-white/60" : "text-ink/55"}`}>{subtitle}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className={`inline-flex min-h-11 items-center gap-2 text-sm font-medium ${light ? "text-white/80 hover:text-white" : "text-primary hover:text-hover"}`}
        >
          {linkLabel}
          <ArrowLeft className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function Stat({ value, label, light = false }: { value: string | number; label: string; light?: boolean }) {
  return (
    <div className={light ? "text-white" : "text-ink"}>
      <p className="text-3xl font-semibold tabular-nums sm:text-4xl">{typeof value === "number" ? formatNumber(value) : value}</p>
      <p className={`mt-2 text-xs ${light ? "text-white/55" : "text-ink/50"}`}>{label}</p>
    </div>
  );
}

export function ProductMiniLink({
  name,
  href,
  price,
  light = false,
}: {
  name: string;
  href: string;
  price: string;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between gap-4 border-b py-3 text-sm ${
        light ? "border-white/15 text-white/80 hover:text-white" : "border-line text-ink/70 hover:text-primary"
      }`}
    >
      <span className="line-clamp-1">{name}</span>
      <span className="flex shrink-0 items-center gap-3">
        <span dir="ltr" className="text-xs tabular-nums opacity-70">{price}</span>
        <ArrowUpLeft className="h-4 w-4 opacity-50 transition-transform group-hover:-translate-x-1 group-hover:translate-y-1" />
      </span>
    </Link>
  );
}
