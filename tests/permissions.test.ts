import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PERMISSIONS,
  expandPermissionKeys,
  roleCanAccessAdmin,
  roleHasPermission,
  roleLabel,
  BUILT_IN_ROLES,
} from "../src/lib/permissions";

test("super admin has every permission", () => {
  for (const permission of PERMISSIONS) {
    assert.equal(roleHasPermission("SUPER_ADMIN", permission), true);
  }
});

test("admin cannot change site settings", () => {
  assert.equal(roleHasPermission("ADMIN", "setting.write"), false);
  assert.equal(roleHasPermission("ADMIN", "order.write"), true);
});

test("order manager is limited to orders and customer reads", () => {
  assert.equal(roleHasPermission("ORDER_MANAGER", "order.write"), true);
  assert.equal(roleHasPermission("ORDER_MANAGER", "product.write"), false);
  assert.equal(roleHasPermission("ORDER_MANAGER", "customer.write"), false);
});

test("product manager can manage catalog but not orders or settings", () => {
  assert.equal(roleHasPermission("PRODUCT_MANAGER", "product.write"), true);
  assert.equal(roleHasPermission("PRODUCT_MANAGER", "inventory.write"), true);
  assert.equal(roleHasPermission("PRODUCT_MANAGER", "order.write"), false);
  assert.equal(roleHasPermission("PRODUCT_MANAGER", "setting.write"), false);
});

test("customers have no admin permission and cannot access the dashboard", () => {
  for (const permission of PERMISSIONS) {
    assert.equal(roleHasPermission("CUSTOMER", permission), false);
  }
  assert.equal(roleCanAccessAdmin("CUSTOMER"), false);
  assert.equal(roleCanAccessAdmin("ADMIN"), true);
  assert.equal(roleCanAccessAdmin("ORDER_MANAGER"), true);
});

test("content, marketing, analyst and support roles follow least privilege", () => {
  assert.equal(roleHasPermission("CONTENT_MANAGER", "cms.manage"), true);
  assert.equal(roleHasPermission("CONTENT_MANAGER", "products.update"), false);
  assert.equal(roleHasPermission("MARKETING_MANAGER", "marketing.manage"), true);
  assert.equal(roleHasPermission("MARKETING_MANAGER", "settings.manage"), false);
  assert.equal(roleHasPermission("ANALYST", "analytics.view"), true);
  assert.equal(roleHasPermission("ANALYST", "products.update"), false);
  assert.equal(roleHasPermission("SUPPORT_AGENT", "orders.view"), true);
  assert.equal(roleHasPermission("SUPPORT_AGENT", "orders.update"), false);
});

test("custom role codes have no implicit permissions and can access admin only with explicit grants", () => {
  assert.equal(roleHasPermission("CUSTOM_MANAGER", "dashboard.view"), false);
  assert.equal(roleLabel("CUSTOM_MANAGER"), "CUSTOM_MANAGER");
  assert.equal(roleCanAccessAdmin("CUSTOM_MANAGER"), true);
  assert.ok(BUILT_IN_ROLES.includes("SUPER_ADMIN"));
});

test("namespaced permissions expand to legacy aliases for existing endpoints", () => {
  const expanded = expandPermissionKeys(["products.update", "orders.update", "customers.view", "settings.manage"]);
  assert.ok(expanded.includes("product.write"));
  assert.ok(expanded.includes("order.write"));
  assert.ok(expanded.includes("customer.read"));
  assert.ok(expanded.includes("setting.write"));
});
