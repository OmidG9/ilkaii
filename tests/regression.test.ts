import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutSchema, productQuerySchema, returnSchema } from "../src/lib/validation";
import { calculateCoupon, orderTotals, shippingCost, type ShippingRates } from "../src/lib/money";

/**
 * Upgrade guards for the planned zod 4 / Next 16 upgrade. These tests use only
 * the public schema/service contract and deliberately avoid Zod internals so
 * they remain meaningful across major versions.
 */

const address = {
  label: "خانه",
  fullName: "سارا احمدی",
  phone: "09123456789",
  province: "تهران",
  city: "تهران",
  street: "خیابان ولیعصر، پلاک ۱۲",
  postalCode: "1234567890",
  isDefault: true,
};

const shippingMethods = ["FLAT", "ALOPEYK", "PISHTAZ", "TIPAX", "POSTAL", "COURIER", "PICKUP"] as const;
const gateways = ["ZARINPAL", "ZIBAL", "BEHPARDAKHT"] as const;

test("checkout contract accepts every supported shipping method and gateway", () => {
  for (const shippingMethod of shippingMethods) {
    for (const paymentGateway of gateways) {
      const parsed = checkoutSchema.safeParse({ address, shippingMethod, paymentMethod: "ONLINE", paymentGateway });
      assert.equal(parsed.success, true, `${shippingMethod}/${paymentGateway}`);
    }
    assert.equal(checkoutSchema.safeParse({ address, shippingMethod, paymentMethod: "COD" }).success, true);
  }
});

test("checkout contract rejects unknown shipping methods and gateways", () => {
  assert.equal(checkoutSchema.safeParse({ address, shippingMethod: "DRONE", paymentMethod: "ONLINE" }).success, false);
  assert.equal(checkoutSchema.safeParse({ address, shippingMethod: "PISHTAZ", paymentMethod: "ONLINE", paymentGateway: "UNKNOWN" }).success, false);
  assert.equal(checkoutSchema.safeParse({ shippingMethod: "PISHTAZ", paymentMethod: "ONLINE" }).success, false);
});

type CouponArg = Parameters<typeof calculateCoupon>[0];

const coupon = (overrides: Record<string, unknown> = {}) => ({
  type: "PERCENTAGE",
  value: 100,
  minPurchase: null,
  maxDiscount: null,
  usageLimit: null,
  usedCount: 0,
  startsAt: null,
  expiresAt: null,
  isActive: true,
  ...overrides,
}) as unknown as CouponArg;

test("coupon contract caps fixed/percentage discounts and enforces limits", () => {
  assert.equal(calculateCoupon(coupon(), 500_000).discount, 500_000);
  assert.equal(calculateCoupon(coupon({ type: "FIXED", value: 1_000_000 }), 500_000).discount, 500_000);
  assert.equal(calculateCoupon(coupon({ value: 20, maxDiscount: 50_000 }), 500_000).discount, 50_000);
  assert.equal(calculateCoupon(coupon({ usageLimit: 2, usedCount: 2 }), 500_000).valid, false);
  assert.equal(calculateCoupon(coupon({ minPurchase: 600_000 }), 500_000).valid, false);
});

test("totals contract never produces a negative total", () => {
  assert.deepEqual(orderTotals({ subtotal: 500_000, discount: 700_000, shipping: 45_000 }), {
    subtotal: 500_000,
    discount: 500_000,
    shipping: 45_000,
    total: 45_000,
  });
  assert.equal(orderTotals({ subtotal: 0, discount: 0, shipping: 0 }).total, 0);
});

test("shipping contract handles new and legacy methods", () => {
  const rates: ShippingRates = {
    flat: 130_000,
    alopeyk: 90_000,
    pishtaz: 45_000,
    tipax: 85_000,
    postal: 45_000,
    courier: 85_000,
    pickup: 0,
    freeThreshold: 1_500_000,
  };
  assert.equal(shippingCost(rates, "FLAT", 100), 130_000);
  assert.equal(shippingCost(rates, "ALOPEYK", 100), 90_000);
  assert.equal(shippingCost(rates, "PISHTAZ", 100), 45_000);
  assert.equal(shippingCost(rates, "TIPAX", 100), 85_000);
  assert.equal(shippingCost(rates, "POSTAL", 100), 45_000);
  assert.equal(shippingCost(rates, "COURIER", 100), 85_000);
  assert.equal(shippingCost(rates, "PICKUP", 100), 0);
  assert.equal(shippingCost(rates, "PISHTAZ", 1_500_000), 0);
});

test("return contract requires line items and bounded quantities", () => {
  const valid = {
    orderId: "clx1234567890",
    reason: "کالا با توضیحات مطابقت ندارد",
    items: [{ orderItemId: "clx1234567891", quantity: 2 }],
  };
  assert.equal(returnSchema.safeParse(valid).success, true);
  assert.equal(returnSchema.safeParse({ ...valid, items: [] }).success, false);
  assert.equal(returnSchema.safeParse({ ...valid, items: [{ orderItemId: "clx1234567891", quantity: 1001 }] }).success, false);
});

test("query contract accepts Persian digits and separators", () => {
  const parsed = productQuerySchema.parse({ minPrice: "۱٬۲۰۰٬۰۰۰", page: "۲" });
  assert.equal(parsed.minPrice, 1_200_000);
  assert.equal(parsed.page, 2);
});
