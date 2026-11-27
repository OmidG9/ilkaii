/**
 * White-label site configuration.
 * Defaults live in code; deployment overrides come from environment variables
 * and the SiteSetting table (editable in the admin dashboard). No rebuild is
 * required to rebrand a deployment.
 */
import { prisma } from "@/lib/db";

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  logo: string;
  locale: string;
  currency: string;
  timezone: string;
  seo: {
    defaultTitle: string;
    defaultDescription: string;
  };
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
    hover: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  shipping: {
    flat: number;
    alopeyk: number;
    pishtaz: number;
    tipax: number;
    /** Legacy setting retained for historical orders. */
    postal: number;
    /** Legacy setting retained for historical orders. */
    courier: number;
    /** Legacy setting retained for historical orders. */
    pickup: number;
    freeThreshold: number;
  };
  features: {
    wishlist: boolean;
    reviews: boolean;
    coupons: boolean;
    sizeGuide: boolean;
    newsletter: boolean;
  };
  content: {
    about: string;
    shippingPolicy: string;
    returnPolicy: string;
    privacyPolicy: string;
    terms: string;
  };
  store: {
    orderPrefix: string;
    invoiceFooter: string;
  };
}

export const defaultSiteConfig: SiteConfig = {
  name: "ilkaii",
  tagline: "پوشاکی که داستان تو را روایت میکند",
  description: "فروشگاه آنلاین پوشاک زنانه و ورزشی با کیفیت برتر",
  locale: "fa-IR",
  currency: "TOMAN",
  timezone: "Asia/Tehran",
  logo: "",
  seo: {
    defaultTitle: "",
    defaultDescription: "",
  },
  theme: {
    primary: "#6B5E57",
    secondary: "#A89C94",
    background: "#F5F1ED",
    text: "#2B2B2B",
    border: "#E8E3DE",
    hover: "#5A4D46",
  },
  contact: {
    email: "hello@ilkaii.com",
    phone: "۰۲۱-۱۲۳۴۵۶۷۸",
    address: "تهران، ایران",
  },
  shipping: {
    flat: 180000,
    /** AloPeyk is paid by the customer on delivery; kept for compatibility. */
    alopeyk: 0,
    pishtaz: 95000,
    tipax: 175000,
    postal: 95000,
    courier: 175000,
    pickup: 0,
    freeThreshold: 1500000,
  },
  features: {
    wishlist: true,
    reviews: true,
    coupons: true,
    sizeGuide: true,
    newsletter: true,
  },
  content: {
    about: "ilkaii برندی ایرانی با تمرکز بر پوشاک زنانه و ورزشی است؛ ما کیفیت، سادگی و اصالت را در کنار هم قرار میدهیم.",
    shippingPolicy: "سفارشها پس از تأیید پرداخت طی ۱ تا ۳ روز کاری آماده ارسال میشوند. هزینه ارسال بر اساس روش انتخابی محاسبه میگردد.",
    returnPolicy: "امکان بازگشت کالا تا ۷ روز پس از تحویل، در صورت عدم استفاده و دارای برچسب اصلی وجود دارد.",
    privacyPolicy: "اطلاعات شخصی شما تنها برای پردازش سفارشها نگهداری میشود و در اختیار اشخاص ثالث قرار داده نمیشود.",
    terms: "با ثبت سفارش، قوانین و شرایط فروشگاه را میپذیرید. قیمتها به تومان نمایش داده میشوند.",
  },
  store: {
    orderPrefix: "ILK",
    invoiceFooter: "",
  },
};

function setPath(target: Record<string, unknown>, key: string, value: unknown) {
  // Config is intentionally flat for site.* fields and nested for the rest.
  const path = key.startsWith("site.") ? key.slice(5) : key;
  const parts = path.split(".");
  let cursor: Record<string, unknown> = target;
  for (const part of parts.slice(0, -1)) {
    const next = cursor[part];
    if (typeof next !== "object" || next === null) return;
    cursor = next as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
}

function parseSetting(key: string, value: string): string | number | boolean | undefined {
  if (/^shipping\./.test(key)) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : undefined;
  }
  if (/^features\./.test(key)) return value === "true";
  if (/^theme\./.test(key)) return /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
  if (value.length > 4000) return undefined;
  return value;
}

/** Merge database settings into defaults without exposing arbitrary keys. */
export function applySiteSettings(
  base: SiteConfig,
  settings: Record<string, string>,
): SiteConfig {
  const result = structuredClone(base) as unknown as Record<string, unknown>;
  for (const [key, raw] of Object.entries(settings)) {
    if (!(editableSettingKeys as readonly string[]).includes(key)) continue;
    const value = parseSetting(key, raw);
    if (value !== undefined) setPath(result, key, value);
  }
  return result as unknown as SiteConfig;
}

/**
 * Server-only. Fails soft when the database is not reachable so that pages can
 * render with defaults during build/health checks.
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const fromEnv: Record<string, string> = {};
  if (process.env.NEXT_PUBLIC_SITE_NAME) fromEnv["site.name"] = process.env.NEXT_PUBLIC_SITE_NAME;
  if (process.env.NEXT_PUBLIC_SITE_TAGLINE) fromEnv["site.tagline"] = process.env.NEXT_PUBLIC_SITE_TAGLINE;
  if (process.env.NEXT_PUBLIC_CONTACT_EMAIL) fromEnv["contact.email"] = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  // Avoid database round-trips (and noisy Prisma errors) during `next build`.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return applySiteSettings(defaultSiteConfig, fromEnv);
  }

  let fromDb: Record<string, string> = {};
  try {
    const rows = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
    fromDb = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch {
    // The database may be unavailable during `next build`; defaults are safe.
  }
  return applySiteSettings(defaultSiteConfig, { ...fromEnv, ...fromDb });
}

export const editableSettingKeys = [
  "site.name", "site.tagline", "site.description", "site.logo", "site.locale", "site.currency", "site.timezone",
  "theme.primary", "theme.secondary", "theme.background", "theme.text", "theme.border", "theme.hover",
  "contact.email", "contact.phone", "contact.address",
  "shipping.flat", "shipping.alopeyk", "shipping.pishtaz", "shipping.tipax",
  "shipping.postal", "shipping.courier", "shipping.pickup", "shipping.freeThreshold",
  "features.wishlist", "features.reviews", "features.coupons", "features.sizeGuide", "features.newsletter",
  "content.about", "content.shippingPolicy", "content.returnPolicy", "content.privacyPolicy", "content.terms",
  "seo.defaultTitle", "seo.defaultDescription",
  "analytics.enabled", "analytics.requireConsent", "analytics.retentionDays",
  "privacy.marketingConsent", "privacy.analyticsCookieDays",
  "backup.frequency", "backup.retentionDays", "backup.lastRunAt",
  "store.orderPrefix", "store.invoiceFooter",
] as const;
