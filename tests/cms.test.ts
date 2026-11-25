import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSectionConfig, sectionConfigTemplate } from "../src/services/cms";

test("homepage HERO config accepts the approved fields", () => {
  const config = parseSectionConfig("HERO", { heading: "عنوان", subheading: "زیرعنوان", ctaHref: "/shop" });
  assert.equal((config as { heading: string }).heading, "عنوان");
});

test("homepage config rejects missing required fields and unsafe links", () => {
  assert.throws(() => parseSectionConfig("HERO", { subheading: "بدون عنوان" }));
  assert.throws(() => parseSectionConfig("HERO", { heading: "عنوان", ctaHref: "javascript:alert(1)" }));
});

test("unknown config keys are stripped instead of persisted", () => {
  const config = parseSectionConfig("CUSTOM_CONTENT", { heading: "عنوان", body: "متن", html: "<script>alert(1)</script>" });
  assert.equal("html" in config, false);
});

test("testimonials require a bounded list", () => {
  assert.throws(() => parseSectionConfig("TESTIMONIALS", { items: [] }));
  const valid = parseSectionConfig("TESTIMONIALS", { items: [{ name: "مشتری", text: "عالی", rating: 5 }] });
  assert.equal((valid as { items: unknown[] }).items.length, 1);
});

test("section templates are themselves valid", () => {
  for (const type of ["HERO", "BANNER", "FEATURED_CATEGORIES", "FEATURED_PRODUCTS", "NEW_ARRIVALS", "BEST_SELLERS", "PROMOTIONAL", "SEASONAL_COLLECTION", "TESTIMONIALS", "CUSTOM_CONTENT"] as const) {
    assert.doesNotThrow(() => parseSectionConfig(type, sectionConfigTemplate(type)), type);
  }
});
