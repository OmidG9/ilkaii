/**
 * All monetary values are integer Iranian Toman internally. Prisma Decimals are
 * converted at the boundary; no floats are used for accumulating totals.
 */
import type { Decimal } from "@prisma/client/runtime/library";
import type { Coupon } from "@prisma/client";

export type Money = number;

export function toToman(value: Decimal | string | number | null | undefined): Money {
  if (value === null || value === undefined) return 0;
  const asString = typeof value === "number" ? value.toString() : value.toString();
  const amount = Math.round(Number(asString));
  if (!Number.isFinite(amount)) throw new Error("Invalid monetary value");
  return amount;
}

export function toDecimalString(value: Money): string {
  if (!Number.isSafeInteger(value)) throw new Error("Monetary value out of range");
  return value.toFixed(2);
}

const faNumber = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

export function formatToman(value: Money, showSymbol = true): string {
  const formatted = faNumber.format(Math.round(value));
  return showSymbol ? `${formatted} تومان` : formatted;
}

export function discountPercent(base: Money, sale: Money): number {
  if (base <= 0 || sale >= base) return 0;
  return Math.round(((base - sale) / base) * 100);
}

export function effectivePrice(base: Money, sale: Money | null, override?: Money | null): Money {
  if (override !== null && override !== undefined && override > 0) return override;
  return sale !== null && sale > 0 && sale < base ? sale : base;
}

export interface CouponResult {
  discount: Money;
  valid: boolean;
  reason?: string;
}

/** Coupon validation and calculation — always executed on the server. */
export function calculateCoupon(
  coupon: Pick<
    Coupon,
    "type" | "value" | "minPurchase" | "maxDiscount" | "usageLimit" | "usedCount" | "startsAt" | "expiresAt" | "isActive"
  > | null,
  subtotal: Money,
  now = new Date(),
): CouponResult {
  if (!coupon || !coupon.isActive) return { discount: 0, valid: false, reason: "کد تخفیف معتبر نیست" };
  if (coupon.startsAt && coupon.startsAt > now) return { discount: 0, valid: false, reason: "کد تخفیف هنوز فعال نشده است" };
  if (coupon.expiresAt && coupon.expiresAt < now) return { discount: 0, valid: false, reason: "کد تخفیف منقضی شده است" };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { discount: 0, valid: false, reason: "ظرفیت کد تخفیف تمام شده است" };
  }
  if (coupon.minPurchase && subtotal < toToman(coupon.minPurchase)) {
    return { discount: 0, valid: false, reason: "مبلغ سفارش برای این کد کافی نیست" };
  }
  let discount = coupon.type === "PERCENTAGE"
    ? Math.round((subtotal * toToman(coupon.value)) / 100)
    : toToman(coupon.value);
  discount = Math.min(discount, subtotal);
  if (coupon.maxDiscount) discount = Math.min(discount, toToman(coupon.maxDiscount));
  return { discount, valid: true };
}

export type ShippingMethodKey = "FLAT" | "ALOPEYK" | "PISHTAZ" | "TIPAX" | "POSTAL" | "COURIER" | "PICKUP";

export interface ShippingRates {
  flat: number;
  alopeyk: number;
  pishtaz: number;
  tipax: number;
  /** Legacy fields keep old orders understandable. */
  postal?: number;
  courier?: number;
  pickup?: number;
  freeThreshold: number;
}

export function shippingCost(
  settings: ShippingRates,
  method: ShippingMethodKey,
  subtotal: Money,
): Money {
  if (method === "ALOPEYK") return 0;
  if (subtotal >= settings.freeThreshold) return 0;
  switch (method) {
    case "FLAT": return settings.flat;
    case "PISHTAZ": return settings.pishtaz;
    case "TIPAX": return settings.tipax;
    case "POSTAL": return settings.postal ?? settings.pishtaz;
    case "COURIER": return settings.courier ?? settings.tipax;
    case "PICKUP": return 0;
    default: return settings.pishtaz;
  }
}

export function orderTotals(params: {
  subtotal: Money;
  discount?: Money;
  shipping: Money;
}) {
  const subtotal = Math.max(0, Math.round(params.subtotal));
  const discount = Math.min(subtotal, Math.max(0, Math.round(params.discount ?? 0)));
  const shipping = Math.max(0, Math.round(params.shipping));
  const total = subtotal - discount + shipping;
  return { subtotal, discount, shipping, total };
}
