import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addressSchema,
  checkoutSchema,
  productSchema,
  requestOtpSchema,
  variantSchema,
} from "../src/lib/validation";

const validAddress = {
  label: "خانه",
  fullName: "سارا احمدی",
  phone: "09123456789",
  province: "تهران",
  city: "تهران",
  street: "خیابان ولیعصر، پلاک ۱۲",
  postalCode: "1234567890",
  isDefault: true,
};

test("addressSchema normalizes phone and accepts a valid address", () => {
  const parsed = addressSchema.parse({ ...validAddress, phone: "۰۹۱۲۳۴۵۶۷۸۹" });
  assert.equal(parsed.phone, "09123456789");
  assert.equal(parsed.isDefault, true);
});

test("addressSchema rejects invalid phone and postal code", () => {
  assert.equal(addressSchema.safeParse({ ...validAddress, phone: "123" }).success, false);
  assert.equal(addressSchema.safeParse({ ...validAddress, postalCode: "123" }).success, false);
  assert.equal(addressSchema.safeParse({ ...validAddress, street: "کم" }).success, false);
});

test("checkoutSchema requires an address reference or payload", () => {
  assert.equal(checkoutSchema.safeParse({ shippingMethod: "POSTAL" }).success, false);
  assert.equal(
    checkoutSchema.safeParse({ address: validAddress, shippingMethod: "POSTAL", paymentMethod: "ONLINE" }).success,
    true,
  );
  assert.equal(
    checkoutSchema.safeParse({ addressId: "clx1234567890", paymentMethod: "COD" }).success,
    true,
  );
});

test("requestOtpSchema normalizes the phone number", () => {
  const parsed = requestOtpSchema.parse({ phone: "+989123456789" });
  assert.equal(parsed.phone, "09123456789");
});

test("productSchema enforces sale price below base price", () => {
  const base = {
    name: "پیراهن کتان",
    slug: "linen-shirt",
    sku: "SKU-1",
    categoryId: "clx1234567890",
    basePrice: 500_000,
  };
  assert.equal(productSchema.safeParse(base).success, true);
  assert.equal(productSchema.safeParse({ ...base, salePrice: 400_000 }).success, true);
  assert.equal(productSchema.safeParse({ ...base, salePrice: 600_000 }).success, false);
});

test("variantSchema rejects negative stock and unsafe SKU", () => {
  assert.equal(variantSchema.safeParse({ size: "M", sku: "V-1", stock: 3 }).success, true);
  assert.equal(variantSchema.safeParse({ size: "M", sku: "V-1", stock: -1 }).success, false);
  assert.equal(variantSchema.safeParse({ size: "", sku: "V-1", stock: 1 }).success, false);
});
