import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatNumber,
  isValidIranianPhone,
  isValidPostalCode,
  normalizeDigits,
  normalizeForSearch,
  normalizeIranianPhone,
} from "../src/lib/persian";

test("normalizeDigits converts Persian and Arabic digits", () => {
  assert.equal(normalizeDigits("۱۲۳۴۵۶۷۸۹۰"), "1234567890");
  assert.equal(normalizeDigits("٠١٢٣٤٥٦٧٨٩"), "0123456789");
  assert.equal(normalizeDigits("abc123"), "abc123");
});

test("normalizeIranianPhone accepts common Iranian formats", () => {
  for (const input of ["09123456789", "۰۹۱۲۳۴۵۶۷۸۹", "+989123456789", "989123456789", "9123456789"]) {
    assert.equal(normalizeIranianPhone(input), "09123456789", `failed for ${input}`);
  }
});

test("normalizeIranianPhone rejects invalid numbers", () => {
  for (const input of ["", "12345", "0912345678", "091234567890", "not-a-phone"]) {
    assert.equal(normalizeIranianPhone(input), null, `should reject ${input}`);
  }
  assert.equal(isValidIranianPhone("021-12345678"), false);
});

test("postal code must be exactly ten digits", () => {
  assert.equal(isValidPostalCode("۱۲۳۴۵۶۷۸۹۰"), true);
  assert.equal(isValidPostalCode("1234567890"), true);
  assert.equal(isValidPostalCode("123456789"), false);
  assert.equal(isValidPostalCode("12345678901"), false);
});

test("normalizeForSearch unifies Arabic/Persian variants", () => {
  // Arabic yeh + Arabic kaf -> Persian yeh + Persian kaf.
  assert.equal(normalizeForSearch("\u064A\u0643"), "\u06CC\u06A9");
  // ZWNJ becomes a space so "مي‌شود" matches "می شود".
  assert.equal(
    normalizeForSearch("\u0645\u064A\u200C\u0634\u0648\u062F"),
    "\u0645\u06CC \u0634\u0648\u062F",
  );
  assert.equal(normalizeForSearch("  پوشاک  "), "پوشاک");
});

test("formatNumber renders Persian digits", () => {
  const formatted = formatNumber(1234);
  assert.match(formatted, /[۰-۹]/);
  assert.doesNotMatch(formatted, /[0-9]/);
});
