import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateCoupon,
  discountPercent,
  effectivePrice,
  orderTotals,
  shippingCost,
  toDecimalString,
  toToman,
} from "../src/lib/money";

type CouponArg = Parameters<typeof calculateCoupon>[0];

function coupon(overrides: Record<string, unknown> = {}): CouponArg {
  return {
    type: "PERCENTAGE",
    value: 10,
    minPurchase: null,
    maxDiscount: null,
    usageLimit: null,
    usedCount: 0,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    ...overrides,
  } as unknown as CouponArg;
}

test("toToman converts decimals and strings to integer Toman", () => {
  assert.equal(toToman("1234.56"), 1235);
  assert.equal(toToman(42), 42);
  assert.equal(toToman(null), 0);
  assert.equal(toToman(undefined), 0);
});

test("toDecimalString rejects unsafe integers", () => {
  assert.equal(toDecimalString(1000), "1000.00");
  assert.throws(() => toDecimalString(Number.MAX_SAFE_INTEGER + 2));
});

test("orderTotals clamps discount to subtotal and never goes negative", () => {
  assert.deepEqual(orderTotals({ subtotal: 1000, discount: 5000, shipping: 200 }), {
    subtotal: 1000,
    discount: 1000,
    shipping: 200,
    total: 200,
  });
  assert.deepEqual(orderTotals({ subtotal: -50, discount: -10, shipping: -5 }), {
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0,
  });
});

test("shippingCost applies free threshold and method price", () => {
  const settings = { flat: 180_000, alopeyk: 0, pishtaz: 95_000, tipax: 175_000, postal: 95_000, courier: 175_000, pickup: 0, freeThreshold: 1_000_000 };
  assert.equal(shippingCost(settings, "FLAT", 500_000), 180_000);
  assert.equal(shippingCost(settings, "ALOPEYK", 500_000), 0);
  assert.equal(shippingCost(settings, "PISHTAZ", 500_000), 95_000);
  assert.equal(shippingCost(settings, "TIPAX", 500_000), 175_000);
  assert.equal(shippingCost(settings, "POSTAL", 500_000), 95_000);
  assert.equal(shippingCost(settings, "COURIER", 500_000), 175_000);
  assert.equal(shippingCost(settings, "PICKUP", 500_000), 0);
  assert.equal(shippingCost(settings, "PISHTAZ", 1_000_000), 0);
});

test("effectivePrice prefers override, then a valid sale price", () => {
  assert.equal(effectivePrice(100_000, 80_000), 80_000);
  assert.equal(effectivePrice(100_000, 120_000), 100_000);
  assert.equal(effectivePrice(100_000, null, 60_000), 60_000);
  assert.equal(effectivePrice(100_000, 80_000, 0), 80_000);
});

test("discountPercent is rounded and safe", () => {
  assert.equal(discountPercent(100_000, 80_000), 20);
  assert.equal(discountPercent(100_000, 100_000), 0);
  assert.equal(discountPercent(0, 0), 0);
});

test("calculateCoupon validates lifecycle and caps percentage discount", () => {
  assert.equal(calculateCoupon(null, 100_000).valid, false);
  assert.equal(calculateCoupon(coupon({ isActive: false }), 100_000).valid, false);

  const percentage = calculateCoupon(coupon({ value: 10 }), 200_000);
  assert.deepEqual(percentage, { discount: 20_000, valid: true });

  const capped = calculateCoupon(coupon({ value: 50, maxDiscount: 30_000 }), 200_000);
  assert.equal(capped.discount, 30_000);

  const fixed = calculateCoupon(coupon({ type: "FIXED", value: 500_000 }), 100_000);
  assert.equal(fixed.discount, 100_000);
});

test("calculateCoupon rejects min purchase, expiry and exhausted usage", () => {
  assert.equal(calculateCoupon(coupon({ minPurchase: 500_000 }), 100_000).valid, false);
  const past = new Date(Date.now() - 86_400_000);
  assert.equal(calculateCoupon(coupon({ expiresAt: past }), 100_000).valid, false);
  const future = new Date(Date.now() + 86_400_000);
  assert.equal(calculateCoupon(coupon({ startsAt: future }), 100_000).valid, false);
  assert.equal(calculateCoupon(coupon({ usageLimit: 2, usedCount: 2 }), 100_000).valid, false);
});
