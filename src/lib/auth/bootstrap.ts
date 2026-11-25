import type { RoleCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";

/** Idempotent role/permission provisioning. Safe to call on every boot. */
export async function ensureRolesAndPermissions() {
  const roleNames: Record<RoleCode, string> = {
    SUPER_ADMIN: "مدیرکل",
    ADMIN: "مدیر",
    ORDER_MANAGER: "مدیر سفارشها",
    PRODUCT_MANAGER: "مدیر محصول",
    CUSTOMER: "مشتری",
  };

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission },
      update: {},
      create: { key: permission, group: permission.split(".")[0] },
    });
  }

  for (const [code, name] of Object.entries(roleNames) as [RoleCode, string][]) {
    await prisma.role.upsert({ where: { code }, update: { name }, create: { code, name } });
  }

  const allPermissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const byKey = new Map(allPermissions.map((p) => [p.key as (typeof PERMISSIONS)[number], p.id]));
  const grants: Record<RoleCode, readonly (typeof PERMISSIONS)[number][]> = {
    SUPER_ADMIN: PERMISSIONS,
    ADMIN: PERMISSIONS.filter((p) => p !== "setting.write"),
    ORDER_MANAGER: ["order.read", "order.write", "customer.read"],
    PRODUCT_MANAGER: ["product.read", "product.write", "inventory.write", "coupon.write"],
    CUSTOMER: [],
  };

  for (const [code, keys] of Object.entries(grants) as [RoleCode, readonly (typeof PERMISSIONS)[number][]][]) {
    const role = await prisma.role.findUnique({ where: { code }, select: { id: true } });
    if (!role) continue;
    for (const key of keys) {
      const permissionId = byKey.get(key);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
}
