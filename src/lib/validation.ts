import { z } from "zod";
import { isValidIranianPhone, isValidPostalCode, normalizeIranianPhone } from "@/lib/persian";

const id = () => z.string().regex(/^[a-zA-Z0-9_-]{8,64}$/, "شناسه نامعتبر است");
const phone = () => z.string().refine(isValidIranianPhone, "شماره موبایل ایرانی نامعتبر است").transform((v) => normalizeIranianPhone(v)!);
const toman = () => z.coerce.number().int().nonnegative().max(1_000_000_000);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

export const productQuerySchema = paginationSchema.extend({
  q: z.string().max(120).optional(),
  category: z.string().max(80).optional(),
  size: z.string().max(10).optional(),
  color: z.string().max(40).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
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
  postalCode: z.string().refine(isValidPostalCode, "کد پستی نامعتبر است"),
  isDefault: z.boolean().default(false),
});

export const profileSchema = z.object({
  firstName: z.string().min(2).max(60).optional(),
  lastName: z.string().min(2).max(60).optional(),
  email: z.string().email().optional().nullable(),
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
  shippingMethod: z.enum(["POSTAL", "COURIER", "PICKUP"]).default("POSTAL"),
  paymentMethod: z.enum(["ONLINE", "COD"]).default("ONLINE"),
  couponCode: z.string().min(3).max(32).optional(),
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

export const returnSchema = z.object({
  orderId: id(),
  reason: z.string().min(10).max(2000),
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
  role: z.enum(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "PRODUCT_MANAGER", "CUSTOMER"]).optional(),
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
    (obj) => Object.keys(obj).every((k) => /^(site|theme|shipping|features|contact|content)\.[a-zA-Z]+$/.test(k)),
    "کلید تنظیمات نامعتبر است",
  ),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
