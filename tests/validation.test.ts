import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addressSchema,
  checkoutSchema,
  productQuerySchema,
  productSchema,
  profileSchema,
  requestOtpSchema,
  returnSchema,
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

test("addressSchema normalizes Persian postal-code digits before storing", () => {
  const parsed = addressSchema.parse({ ...validAddress, postalCode: "۱۲۳۴۵۶۷۸۹۰" });
  assert.equal(parsed.postalCode, "1234567890");
});

test("productQuerySchema accepts Persian digits and thousands separators", () => {
  const parsed = productQuerySchema.parse({
    minPrice: "۱٬۲۰۰٬۰۰۰",
    maxPrice: "2,500,000",
    page: "۲",
    pageSize: "۲۴",
  });
  assert.equal(parsed.minPrice, 1_200_000);
  assert.equal(parsed.maxPrice, 2_500_000);
  assert.equal(parsed.page, 2);
  assert.equal(parsed.pageSize, 24);
});

test("profileSchema lets customers clear optional names and email", () => {
  const parsed = profileSchema.parse({ firstName: "", lastName: "  ", email: "" });
  assert.equal(parsed.firstName, null);
  assert.equal(parsed.lastName, null);
  assert.equal(parsed.email, null);
});

test("checkoutSchema requires an address reference or payload", () => {
  assert.equal(checkoutSchema.safeParse({ shippingMethod: "PISHTAZ" }).success, false);
  assert.equal(
    checkoutSchema.safeParse({ address: validAddress, shippingMethod: "PISHTAZ", paymentMethod: "ONLINE", paymentGateway: "ZARINPAL" }).success,
    true,
  );
  assert.equal(
    checkoutSchema.safeParse({ addressId: "clx1234567890", paymentMethod: "COD" }).success,
    false,
  );
  assert.equal(
    checkoutSchema.safeParse({ address: validAddress, shippingMethod: "ALOPEYK", paymentGateway: "ZIBAL" }).success,
    true,
  );
  assert.equal(
    checkoutSchema.safeParse({ address: validAddress, paymentGateway: "UNKNOWN" }).success,
    false,
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

test("returnSchema requires per-line quantities and unique lines", () => {
  const base = {
    orderId: "clx1234567890",
    reason: "کالا با توضیحات سایت مطابقت ندارد",
    items: [{ orderItemId: "clx1234567891", quantity: 1 }],
  };
  assert.equal(returnSchema.safeParse(base).success, true);
  assert.equal(returnSchema.safeParse({ ...base, items: [] }).success, false);
  assert.equal(returnSchema.safeParse({ ...base, items: [{ orderItemId: "clx1234567891", quantity: 0 }] }).success, false);
  assert.equal(returnSchema.safeParse({
    ...base,
    items: [
      { orderItemId: "clx1234567891", quantity: 1 },
      { orderItemId: "clx1234567891", quantity: 1 },
    ],
  }).success, false);
});

test("variantSchema rejects negative stock and unsafe SKU", () => {
  assert.equal(variantSchema.safeParse({ size: "M", sku: "V-1", stock: 3 }).success, true);
  assert.equal(variantSchema.safeParse({ size: "M", sku: "V-1", stock: -1 }).success, false);
  assert.equal(variantSchema.safeParse({ size: "", sku: "V-1", stock: 1 }).success, false);
});
