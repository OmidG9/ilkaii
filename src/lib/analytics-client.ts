import type { AnalyticsEventName } from "@/lib/analytics-types";

interface AnalyticsWindow extends Window {
  __ilkaiiAnalytics?: { allowed: boolean };
}

export function setAnalyticsAllowed(allowed: boolean) {
  if (typeof window === "undefined") return;
  (window as AnalyticsWindow).__ilkaiiAnalytics = { allowed };
}

function eventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export interface TrackProperties {
  productId?: string;
  categoryId?: string;
  variantId?: string;
  path?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Best-effort first-party tracking. Anonymous session identity is an HttpOnly
 * server cookie; this function never reads or stores personal identifiers.
 */
export function track(name: AnalyticsEventName, properties: TrackProperties = {}) {
  if (typeof window === "undefined") return;
  const state = (window as AnalyticsWindow).__ilkaiiAnalytics;
  if (!state?.allowed) return;

  const url = new URL(window.location.href);
  const payload = {
    eventId: eventId(),
    name,
    path: properties.path ?? `${url.pathname}${url.search}`.slice(0, 512),
    referrer: document.referrer ? document.referrer.slice(0, 1024) : undefined,
    utmSource: url.searchParams.get("utm_source")?.slice(0, 160) ?? undefined,
    utmMedium: url.searchParams.get("utm_medium")?.slice(0, 160) ?? undefined,
    utmCampaign: url.searchParams.get("utm_campaign")?.slice(0, 160) ?? undefined,
    productId: properties.productId,
    categoryId: properties.categoryId,
    variantId: properties.variantId,
    metadata: properties.metadata,
  };
  void fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}
