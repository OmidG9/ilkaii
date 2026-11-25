import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsEventSchema, analyticsConsentSchema } from "../src/lib/validation";

test("analytics events accept the documented event set and properties", () => {
  const parsed = analyticsEventSchema.safeParse({
    eventId: "abc12345def",
    name: "product_view",
    path: "/product/test",
    productId: "p1",
    categoryId: "c1",
    metadata: { size: "M", color: "black" },
  });
  assert.equal(parsed.success, true);
});

test("analytics events reject unknown event names", () => {
  const parsed = analyticsEventSchema.safeParse({ eventId: "abc12345def", name: "keystroke", path: "/" });
  assert.equal(parsed.success, false);
});

test("analytics metadata rejects sensitive fields and oversized payloads", () => {
  const sensitive = analyticsEventSchema.safeParse({
    eventId: "abc12345def",
    name: "product_view",
    path: "/",
    metadata: { password: "secret" },
  });
  assert.equal(sensitive.success, false);

  const tooMany = analyticsEventSchema.safeParse({
    eventId: "abc12345def",
    name: "product_view",
    path: "/",
    metadata: Object.fromEntries(Array.from({ length: 21 }, (_, index) => [`k${index}`, "v"])),
  });
  assert.equal(tooMany.success, false);
});

test("analytics consent requires explicit booleans", () => {
  assert.equal(analyticsConsentSchema.safeParse({ analytics: true }).success, true);
  assert.equal(analyticsConsentSchema.safeParse({ analytics: "yes" }).success, false);
});
