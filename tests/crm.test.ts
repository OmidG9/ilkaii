import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyCustomerSegments, VIP_SPEND } from "../src/services/crm";

const now = new Date("2026-11-25T12:00:00Z");
const base = {
  createdAt: new Date("2026-11-01T12:00:00Z"),
  lastActivity: new Date("2026-11-20T12:00:00Z"),
  paidOrders: 0,
  spent: 0,
  cartItems: 0,
  lastPurchase: null as Date | null,
  cancelledOrders: 0,
};

test("new customers have no paid orders and are recent", () => {
  assert.deepEqual(classifyCustomerSegments(base, now), ["new"]);
});

test("VIP and high-value segments depend on observed lifetime spend", () => {
  assert.deepEqual(classifyCustomerSegments({ ...base, paidOrders: 3, spent: VIP_SPEND, lastPurchase: new Date("2026-11-20T12:00:00Z") }, now), ["returning", "vip"]);
  assert.deepEqual(classifyCustomerSegments({ ...base, paidOrders: 1, spent: 3_500_000, lastPurchase: new Date("2026-11-20T12:00:00Z") }, now), ["high-value"]);
});

test("inactive, cart-abandoner and frequent-cancellation rules are independent", () => {
  const segments = classifyCustomerSegments({
    ...base,
    paidOrders: 2,
    spent: 1_000_000,
    lastPurchase: new Date("2026-10-01T12:00:00Z"),
    lastActivity: new Date("2026-01-01T12:00:00Z"),
    cartItems: 2,
    cancelledOrders: 2,
  }, now);
  assert.deepEqual(segments.sort(), ["cart-abandoner", "frequent-cancellations", "inactive", "returning"]);
});
