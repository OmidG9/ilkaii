import { test } from "node:test";
import assert from "node:assert/strict";
import { PERMISSIONS, roleCanAccessAdmin, roleHasPermission } from "../src/lib/permissions";

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
