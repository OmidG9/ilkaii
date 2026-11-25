import type { RoleCode } from "@prisma/client";

export const PERMISSIONS = [
  "product.read", "product.write", "inventory.write",
  "order.read", "order.write", "customer.read", "customer.write",
  "coupon.write", "setting.write", "audit.read",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

const MATRIX: Record<RoleCode, readonly PermissionKey[]> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: PERMISSIONS.filter((p) => p !== "setting.write"),
  ORDER_MANAGER: ["order.read", "order.write", "customer.read"],
  PRODUCT_MANAGER: ["product.read", "product.write", "inventory.write", "coupon.write"],
  CUSTOMER: [],
};

export function roleHasPermission(role: RoleCode, permission: PermissionKey): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export function roleCanAccessAdmin(role: RoleCode): boolean {
  return role !== "CUSTOMER";
}

export const ROLE_LABELS: Record<RoleCode, string> = {
  SUPER_ADMIN: "مدیرکل",
  ADMIN: "مدیر",
  ORDER_MANAGER: "مدیر سفارشها",
  PRODUCT_MANAGER: "مدیر محصول",
  CUSTOMER: "مشتری",
};
