import { prisma } from "@/lib/db";
import {
  BUILT_IN_ROLES,
  DEFAULT_GRANTS,
  PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLE_NAMES,
  type BuiltInRoleCode,
} from "@/lib/permissions";

/**
 * Idempotent role/permission provisioning. Safe to call on every boot.
 *
 * Only missing grants are added so operator customisations of built-in roles are
 * preserved. Pass `{ sync: true }` to reset built-in roles to the code-defined
 * matrix (used by tests/seed when an explicit reset is desired).
 */
export async function ensureRolesAndPermissions(options: { sync?: boolean } = {}) {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission },
      update: { group: permission.split(".")[0] },
      create: { key: permission, group: permission.split(".")[0] },
    });
  }

  for (const code of BUILT_IN_ROLES) {
    const name = ROLE_NAMES[code];
    await prisma.role.upsert({
      where: { code },
      update: { name, description: ROLE_DESCRIPTIONS[code], isSystem: true },
      create: { code, name, description: ROLE_DESCRIPTIONS[code], isSystem: true },
    });
  }

  const allPermissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const byKey = new Map(allPermissions.map((permission) => [permission.key, permission.id]));

  for (const code of BUILT_IN_ROLES) {
    const role = await prisma.role.findUnique({ where: { code }, select: { id: true } });
    if (!role) continue;
    const grants = DEFAULT_GRANTS[code as BuiltInRoleCode];
    if (options.sync) {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    }
    for (const key of grants) {
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
