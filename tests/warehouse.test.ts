import assert from "node:assert/strict";
import test from "node:test";
import {
  inventoryBulkSchema,
  inventoryVariantUpdateSchema,
  purchaseOrderReceiveSchema,
  purchaseOrderSchema,
  stocktakeCountsSchema,
  stocktakeCreateSchema,
  supplierSchema,
} from "../src/lib/validation";
import { inventoryReasonLabels } from "../src/lib/labels";

const variantId = "clvariant000000000000001";

test("purchaseOrderSchema accepts a valid multi-line order and applies defaults", () => {
  const parsed = purchaseOrderSchema.parse({
    supplierId: "clsupplier00000000000001",
    items: [
      { variantId, quantity: 12, unitCost: 450_000 },
      { variantId: "clvariant000000000000002", quantity: 3, unitCost: 1_200_000 },
    ],
  });
  assert.equal(parsed.shippingCost, 0);
  assert.equal(parsed.discountAmount, 0);
  assert.equal(parsed.items.length, 2);
});

test("purchaseOrderSchema rejects duplicate variants and empty orders", () => {
  assert.equal(purchaseOrderSchema.safeParse({
    supplierId: "clsupplier00000000000001",
    items: [
      { variantId, quantity: 1, unitCost: 1000 },
      { variantId, quantity: 2, unitCost: 1000 },
    ],
  }).success, false);
  assert.equal(purchaseOrderSchema.safeParse({
    supplierId: "clsupplier00000000000001",
    items: [],
  }).success, false);
});

test("purchaseOrderReceiveSchema rejects duplicate lines and negative quantities", () => {
  const itemId = "clitem000000000000000001";
  assert.equal(purchaseOrderReceiveSchema.safeParse({ items: [{ itemId, quantity: 1 }, { itemId, quantity: 2 }] }).success, false);
  assert.equal(purchaseOrderReceiveSchema.safeParse({ items: [{ itemId, quantity: -1 }] }).success, false);
  assert.equal(purchaseOrderReceiveSchema.safeParse({ items: [{ itemId, quantity: 4 }] }).success, true);
});

test("stocktake scope CATEGORY requires a category id", () => {
  assert.equal(stocktakeCreateSchema.safeParse({ scope: "CATEGORY" }).success, false);
  assert.equal(stocktakeCreateSchema.safeParse({ scope: "CATEGORY", categoryId: "clcategory000000000001" }).success, true);
  assert.equal(stocktakeCreateSchema.safeParse({ scope: "ALL" }).success, true);
});

test("stocktakeCountsSchema accepts zero counts and rejects duplicates", () => {
  const itemId = "clitem000000000000000001";
  assert.equal(stocktakeCountsSchema.safeParse({ counts: [{ itemId, countedQuantity: 0 }] }).success, true);
  assert.equal(stocktakeCountsSchema.safeParse({ counts: [{ itemId, countedQuantity: 1 }, { itemId, countedQuantity: 2 }] }).success, false);
  assert.equal(stocktakeCountsSchema.safeParse({ counts: [] }).success, false);
});

test("inventoryVariantUpdateSchema allows clearing fields and rejects an empty patch", () => {
  assert.equal(inventoryVariantUpdateSchema.safeParse({}).success, false);
  const parsed = inventoryVariantUpdateSchema.parse({ barcode: null, costPrice: null, supplierId: null });
  assert.equal(parsed.barcode, null);
  assert.equal(parsed.costPrice, null);
  assert.equal(inventoryVariantUpdateSchema.safeParse({ barcode: "A-12" }).success, true);
});

test("supplierSchema validates optional email and clamps lead time", () => {
  assert.equal(supplierSchema.safeParse({ name: "نسیم پارچه", email: "not-an-email" }).success, false);
  assert.equal(supplierSchema.safeParse({ name: "نسیم پارچه", email: "" }).success, true);
  assert.equal(supplierSchema.safeParse({ name: "نسیم پارچه", leadTimeDays: 400 }).success, false);
  const parsed = supplierSchema.parse({ name: "نسیم پارچه" });
  assert.equal(parsed.isActive, true);
  assert.equal(parsed.leadTimeDays, 0);
});

test("inventoryBulkSchema rejects negative absolute stock and accepts negative deltas", () => {
  assert.equal(inventoryBulkSchema.safeParse({ ids: [variantId], mode: "set", quantity: -1, reason: "ADJUSTMENT" }).success, false);
  assert.equal(inventoryBulkSchema.safeParse({ ids: [variantId], mode: "increment", quantity: -1, reason: "ADJUSTMENT" }).success, true);
  assert.equal(inventoryBulkSchema.safeParse({ ids: [], mode: "increment", quantity: 1, reason: "RESTOCK" }).success, false);
});

test("every inventory reason has a Persian label", () => {
  for (const reason of ["SALE", "RESTOCK", "ADJUSTMENT", "RETURN", "CANCELLATION", "PURCHASE", "STOCKTAKE", "DAMAGE"]) {
    assert.ok(inventoryReasonLabels[reason as keyof typeof inventoryReasonLabels]);
  }
});
