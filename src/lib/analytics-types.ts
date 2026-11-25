export const ANALYTICS_EVENT_NAMES = [
  "page_view", "product_view", "category_view", "search", "filter_applied",
  "variant_selected", "add_to_cart", "remove_from_cart", "wishlist_add",
  "begin_checkout", "add_shipping_info", "payment_initiated", "purchase", "refund",
  "review_submitted",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export interface AnalyticsEventPayload {
  eventId: string;
  name: AnalyticsEventName;
  path: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  productId?: string;
  categoryId?: string;
  variantId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  clientTimestamp?: string;
}

export const FUNNEL_STAGES = [
  { key: "visitor", label: "بازدیدکننده", event: null },
  { key: "product_view", label: "مشاهده محصول", event: "product_view" },
  { key: "add_to_cart", label: "افزودن به سبد", event: "add_to_cart" },
  { key: "begin_checkout", label: "شروع تسویه", event: "begin_checkout" },
  { key: "payment_initiated", label: "شروع پرداخت", event: "payment_initiated" },
  { key: "purchase", label: "خرید", event: "purchase" },
] as const;
