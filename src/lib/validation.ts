import { z } from "zod";
import { isValidIranianPhone, isValidPostalCode, normalizeDigits, normalizeIranianPhone } from "@/lib/persian";
import { ANALYTICS_EVENT_NAMES } from "@/lib/analytics-types";

const id = () => z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/, "شناسه نامعتبر است");
const phone = () => z.string().refine(isValidIranianPhone, "شماره موبایل ایرانی نامعتبر است").transform((v) => normalizeIranianPhone(v)!);
const toman = () => z.coerce.number().int().nonnegative().max(1_000_000_000);

/** Query-string numbers accept Persian/Arabic digits and thousands separators. */
function queryNumber() {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const normalized = normalizeDigits(String(value)).replace(/[^\d]/g, "");
    return normalized ? Number(normalized) : undefined;
  }, z.number().int().nonnegative().optional());
}

function queryPositiveInt(defaultValue: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const normalized = normalizeDigits(String(value)).replace(/[^\d]/g, "");
    return normalized ? Number(normalized) : undefined;
  }, z.number().int().min(1).default(defaultValue));
}

export const paginationSchema = z.object({
  page: queryPositiveInt(1),
  pageSize: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return undefined;
    const normalized = normalizeDigits(String(value)).replace(/[^\d]/g, "");
    return normalized ? Number(normalized) : undefined;
  }, z.number().int().min(1).max(48).default(12)),
});

export const productQuerySchema = paginationSchema.extend({
  q: z.string().max(120).optional(),
  category: z.string().max(80).optional(),
  size: z.string().max(10).optional(),
  color: z.string().max(40).optional(),
  minPrice: queryNumber(),
  maxPrice: queryNumber(),
  sort: z.enum(["newest", "price-asc", "price-desc", "popular", "name"]).default("newest"),
  available: z.enum(["true", "false"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  newArrival: z.enum(["true", "false"]).optional(),
});

export const requestOtpSchema = z.object({ phone: phone() });
export const verifyOtpSchema = z.object({
  phone: phone(),
  otp: z.string().regex(/^\d{6}$/, "کد تأیید باید ۶ رقم باشد"),
});

export const addressSchema = z.object({
  label: z.string().min(2).max(60),
  fullName: z.string().min(3).max(100),
  phone: phone(),
  province: z.string().min(2).max(60),
  city: z.string().min(2).max(60),
  street: z.string().min(5).max(300),
  postalCode: z.string()
    .transform((value) => normalizeDigits(value).replace(/\D/g, ""))
    .refine(isValidPostalCode, "کد پستی نامعتبر است"),
  isDefault: z.boolean().default(false),
});

const optionalName = () => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? null : value,
  z.string().trim().min(2).max(60).nullable().optional(),
);

export const profileSchema = z.object({
  firstName: optionalName(),
  lastName: optionalName(),
  email: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? null : value,
    z.string().email().max(320).nullable().optional(),
  ),
  marketingOptIn: z.boolean().optional(),
});

export const cartAddSchema = z.object({
  productId: id(),
  variantId: id().optional(),
  quantity: z.number().int().min(1).max(20),
});
export const cartUpdateSchema = z.object({ quantity: z.number().int().min(1).max(20) });

export const checkoutSchema = z.object({
  // Use a saved address or supply a new one (validated and created atomically).
  addressId: id().optional(),
  address: addressSchema.optional(),
  shippingMethod: z.enum(["FLAT", "ALOPEYK", "PISHTAZ", "TIPAX", "POSTAL", "COURIER", "PICKUP"]).default("PISHTAZ"),
  paymentMethod: z.enum(["ONLINE", "COD"]).default("ONLINE"),
  paymentGateway: z.enum(["ZARINPAL", "ZIBAL", "BEHPARDAKHT"]).default("ZARINPAL"),
  couponCode: z.string().trim().min(3).max(32).transform((value) => value.toUpperCase()).optional(),
  expectPayment: z.boolean().default(true),
}).refine((v) => Boolean(v.addressId || v.address), {
  message: "آدرس تحویل الزامی است",
  path: ["addressId"],
});

export const couponSchema = z.object({
  code: z.string().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minPurchase: z.number().nonnegative().optional(),
  maxDiscount: z.number().nonnegative().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().min(2).max(180),
  slug: z.string().min(2).max(180).regex(/^[a-z0-9-]+$/, "اسلاگ نامعتبر است"),
  sku: z.string().min(2).max(64),
  description: z.string().max(8000).optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: id(),
  brandId: id().optional(),
  basePrice: toman(),
  salePrice: toman().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  gender: z.enum(["WOMEN", "MEN", "UNISEX", "KIDS"]).optional(),
  season: z.enum(["SPRING", "SUMMER", "AUTUMN", "WINTER", "ALL_SEASON"]).optional(),
  material: z.string().max(120).optional(),
  fabricComposition: z.string().max(240).optional(),
  careInstructions: z.string().max(1000).optional(),
  reorderLevel: z.number().int().nonnegative().default(5),
  heroImage: z.string().max(1024).optional(),
  metaTitle: z.string().max(180).optional(),
  metaDescription: z.string().max(320).optional(),
}).refine((v) => v.salePrice === undefined || v.salePrice < v.basePrice, {
  message: "قیمت تخفیف باید کمتر از قیمت اصلی باشد",
  path: ["salePrice"],
});

export const variantSchema = z.object({
  size: z.string().min(1).max(20),
  color: z.string().max(40).optional(),
  sku: z.string().min(2).max(64),
  price: toman().optional(),
  stock: z.number().int().nonnegative().max(1_000_000),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  isAvailable: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  image: z.string().max(1024).optional(),
  icon: z.string().max(40).optional(),
  parentId: id().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().nonnegative().default(0),
});

export const reviewSchema = z.object({
  productId: id(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(10).max(2000),
});

export const returnItemSchema = z.object({
  orderItemId: id(),
  quantity: z.number().int().min(1).max(1000),
});

export const returnSchema = z.object({
  orderId: id(),
  reason: z.string().min(10).max(2000),
  items: z.array(returnItemSchema)
    .min(1, "حداقل یک قلم کالا را انتخاب کنید")
    .max(50)
    .refine(
      (items) => new Set(items.map((item) => item.orderItemId)).size === items.length,
      "هر قلم کالا فقط یک بار قابل انتخاب است",
    ),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING_PAYMENT", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  note: z.string().max(500).optional(),
  trackingNumber: z.string().max(80).optional(),
});

export const brandSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
});

export const inventoryAdjustmentSchema = z.object({
  variantId: id(),
  quantity: z.number().int().min(-1_000_000).max(1_000_000),
  reason: z.enum(["RESTOCK", "ADJUSTMENT", "RETURN"]),
  note: z.string().max(500).optional(),
});

export const customerUpdateSchema = z.object({
  role: z.string().min(2).max(64).regex(/^[A-Z0-9_]+$/).optional(),
  isActive: z.boolean().optional(),
});

export const reviewModerationSchema = z.object({ isApproved: z.boolean() });

export const returnProcessSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "COMPLETED"]),
  note: z.string().max(2000).optional(),
});

export const productImageSchema = z.object({
  url: z.string().max(1024).min(1).refine(
    (value) => value.startsWith("/") || /^https?:\/\//i.test(value),
    "آدرس تصویر باید با / یا http(s):// شروع شود",
  ),
  altText: z.string().max(200).optional(),
  color: z.string().max(40).optional(),
  variantId: id().optional(),
});

export const settingsSchema = z.object({
  settings: z.record(z.string().max(4000)).refine(
    (obj) => Object.keys(obj).every((k) => /^(site|theme|shipping|features|contact|content|seo|analytics|privacy|backup|store)\.[a-zA-Z]+$/.test(k)),
    "کلید تنظیمات نامعتبر است",
  ),
});

export const roleCreateSchema = z.object({
  code: z.string().min(3).max(40).regex(/^[A-Za-z0-9_]+$/),
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  permissions: z.array(z.string().max(80)).max(80).optional(),
});

export const roleUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(300).optional(),
  permissions: z.array(z.string().max(80)).max(80).optional(),
});

export const adminUserUpdateSchema = z.object({
  role: z.string().min(2).max(64).regex(/^[A-Z0-9_]+$/).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => value.role !== undefined || value.isActive !== undefined, "تغییری ارسال نشده است");

export const adminProductBulkSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), ids: z.array(id()).min(1).max(100), status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"]) }),
  z.object({ action: z.literal("price"), ids: z.array(id()).min(1).max(100), mode: z.enum(["set", "percent"]), value: z.number().min(-90).max(1_000_000_000) }),
  z.object({ action: z.literal("stock"), ids: z.array(id()).min(1).max(100), mode: z.enum(["set", "increment"]), value: z.number().int().min(-1_000_000).max(1_000_000) }),
  z.object({ action: z.literal("archive"), ids: z.array(id()).min(1).max(100) }),
  z.object({ action: z.literal("feature"), ids: z.array(id()).min(1).max(100), isFeatured: z.boolean() }),
]);

export const analyticsEventNames = [
  "page_view", "product_view", "category_view", "search", "filter_applied",
  "variant_selected", "add_to_cart", "remove_from_cart", "wishlist_add",
  "begin_checkout", "add_shipping_info", "payment_initiated", "purchase", "refund",
  "review_submitted",
] as const;

export const analyticsEventSchema = z.object({
  eventId: z.string().min(8).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.enum(ANALYTICS_EVENT_NAMES),
  path: z.string().min(1).max(512),
  referrer: z.string().max(1024).optional(),
  utmSource: z.string().max(160).optional(),
  utmMedium: z.string().max(160).optional(),
  utmCampaign: z.string().max(160).optional(),
  productId: z.string().max(64).optional(),
  categoryId: z.string().max(64).optional(),
  variantId: z.string().max(64).optional(),
  metadata: z.record(z.union([z.string().max(300), z.number(), z.boolean(), z.null()])).refine(
    (value) => Object.keys(value).length <= 20 && Object.keys(value).every((key) => !/^(password|otp|token|card|cvv|secret|authorization)$/i.test(key)),
    "محتوای متادیتا مجاز نیست",
  ).optional(),
  clientTimestamp: z.string().datetime().optional(),
});

export const analyticsConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean().default(false),
});

export const cmsPageSchema = z.object({
  slug: z.string().min(2).max(160).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(200),
  excerpt: z.string().max(2000).optional(),
  content: z.string().min(1).max(200_000),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  scheduledAt: z.string().datetime().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(400).optional(),
  ogImage: z.string().max(1024).optional(),
});
export const cmsPageUpdateSchema = cmsPageSchema.partial();

export const homepageSectionSchema = z.object({
  type: z.enum(["HERO", "BANNER", "FEATURED_CATEGORIES", "FEATURED_PRODUCTS", "NEW_ARRIVALS", "BEST_SELLERS", "PROMOTIONAL", "SEASONAL_COLLECTION", "TESTIMONIALS", "CUSTOM_CONTENT"]),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(400).optional(),
  config: z.record(z.unknown()).default({}),
  displayOrder: z.number().int().min(0).max(999).default(0),
  isEnabled: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
}).refine((value) => !value.startsAt || !value.endsAt || new Date(value.startsAt) <= new Date(value.endsAt), {
  message: "زمان پایان باید بعد از شروع باشد", path: ["endsAt"],
});
export const homepageSectionUpdateSchema = z.object({
  type: z.enum(["HERO", "BANNER", "FEATURED_CATEGORIES", "FEATURED_PRODUCTS", "NEW_ARRIVALS", "BEST_SELLERS", "PROMOTIONAL", "SEASONAL_COLLECTION", "TESTIMONIALS", "CUSTOM_CONTENT"]).optional(),
  title: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(400).nullable().optional(),
  config: z.record(z.unknown()).optional(),
  displayOrder: z.number().int().min(0).max(999).optional(),
  isEnabled: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});
export const reorderSchema = z.object({ ids: z.array(z.string().min(1).max(64)).min(1).max(200), menuId: z.string().max(64).optional() });

export const bannerSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(400).optional(),
  image: z.string().min(1).max(1024).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "آدرس تصویر نامعتبر است"),
  mobileImage: z.string().max(1024).refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value), "آدرس تصویر نامعتبر است").optional(),
  href: z.string().max(1024).refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value), "آدرس لینک نامعتبر است").optional(),
  placement: z.string().max(40).default("HOME"),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).max(999).default(0),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});
export const bannerUpdateSchema = bannerSchema.partial();

export const menuItemSchema = z.object({
  label: z.string().min(1).max(120),
  href: z.string().min(1).max(1024).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "آدرس لینک نامعتبر است"),
  parentId: z.string().max(64).optional(),
  target: z.enum(["_self", "_blank"]).default("_self"),
  displayOrder: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});
export const menuItemUpdateSchema = menuItemSchema.partial().extend({ parentId: z.string().max(64).nullable().optional() });

export const blogPostSchema = z.object({
  slug: z.string().min(2).max(180).regex(/^[a-z0-9-]+$/),
  title: z.string().min(2).max(220),
  excerpt: z.string().max(2000).optional(),
  content: z.string().min(1).max(200_000),
  coverImage: z.string().max(1024).optional(),
  status: z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  scheduledAt: z.string().datetime().optional(),
  tags: z.string().max(500).optional(),
  readingMinutes: z.number().int().min(1).max(120).default(4),
  metaTitle: z.string().max(220).optional(),
  metaDescription: z.string().max(400).optional(),
});
export const blogPostUpdateSchema = blogPostSchema.partial();

export const campaignSchema = z.object({
  name: z.string().min(2).max(180),
  channel: z.enum(["EMAIL", "SMS", "BANNER"]).default("EMAIL"),
  status: z.enum(["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).default("DRAFT"),
  subject: z.string().max(250).optional(),
  content: z.string().min(1).max(50_000),
  audience: z.string().max(120).optional(),
  couponId: z.string().max(64).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  utmSource: z.string().max(160).optional(),
  utmMedium: z.string().max(160).optional(),
  utmCampaign: z.string().max(160).optional(),
});

export const subscriberSchema = z.object({
  email: z.string().email().max(320).optional(),
  phone: z.string().max(20).optional(),
  status: z.enum(["PENDING", "ACTIVE", "UNSUBSCRIBED", "BOUNCED"]).default("PENDING"),
  source: z.string().max(120).optional(),
}).refine((value) => Boolean(value.email || value.phone), "ایمیل یا موبایل الزامی است");
export const subscriberUpdateSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "UNSUBSCRIBED", "BOUNCED"]),
});
export const campaignUpdateSchema = campaignSchema.partial();

export const newsletterSubscribeSchema = z.object({
  email: z.string().email().max(320).optional(),
  phone: phone().optional(),
  source: z.string().max(120).optional(),
}).refine((value) => Boolean(value.email || value.phone), "ایمیل یا موبایل الزامی است");

export const newsletterUnsubscribeSchema = z.object({
  token: z.string().min(16).max(64).regex(/^[a-f0-9]+$/),
});

export const secretUpdateSchema = z.object({
  key: z.string().min(3).max(120),
  value: z.string().max(2000).optional(),
  action: z.enum(["set", "delete"]).default("set"),
});

export const mediaUpdateSchema = z.object({
  id: z.string().min(1).max(64),
  altText: z.string().max(300).optional(),
  folder: z.string().max(160).optional(),
});

export const customerNotesSchema = z.object({
  adminNote: z.string().max(4000).optional(),
  marketingOptIn: z.boolean().optional(),
}).refine((value) => value.adminNote !== undefined || value.marketingOptIn !== undefined, "تغییری ارسال نشده است");

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
