import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";
import type { PermissionKey } from "@/lib/permissions";
import { expandPermissionKeys, PERMISSIONS } from "@/lib/permissions";

export async function listAdminUsers(query?: string) {
  const q = query?.trim().slice(0, 120);
  return prisma.user.findMany({
    where: {
      AND: [
        { OR: [{ role: { not: "CUSTOMER" } }, { roles: { some: {} } }] },
        ...(q ? [{ OR: [{ phone: { contains: q } }, { firstName: { contains: q } }, { lastName: { contains: q } }] }] : []),
      ],
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, phone: true, firstName: true, lastName: true, role: true, isActive: true,
      lastLogin: true, createdAt: true, email: true,
      _count: { select: { sessions: { where: { revokedAt: null, expiresAt: { gt: new Date() } } } } },
    },
  });
}

export async function listRoles() {
  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    include: {
      permissions: { select: { permission: { select: { key: true } } } },
      _count: { select: { users: true } },
    },
  });
  return roles.map((role) => ({
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    userCount: role._count.users,
    permissions: role.permissions.map((entry) => entry.permission.key),
  }));
}

export async function createRole(input: { code: string; name: string; description?: string; permissions?: string[] }, actorId: string) {
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9_]{3,40}$/.test(code)) throw Errors.badRequest("کد نقش نامعتبر است");
  if (await prisma.role.findUnique({ where: { code } })) throw Errors.conflict("این کد نقش قبلاً ثبت شده است");
  const permissions = (input.permissions ?? []).filter((key): key is PermissionKey => (PERMISSIONS as readonly string[]).includes(key));
  const role = await prisma.role.create({
    data: {
      code,
      name: input.name.trim().slice(0, 80),
      description: input.description?.slice(0, 300) ?? null,
      isSystem: false,
      permissions: {
        create: await permissionIds(expandPermissionKeys(permissions)),
      },
    },
    select: { id: true, code: true, name: true },
  });
  await audit({ actorId, action: "role.created", entity: "Role", entityId: role.id, after: { code, name: input.name, permissions }, severity: "critical" });
  return role;
}

async function permissionIds(keys: readonly PermissionKey[]) {
  const rows = await prisma.permission.findMany({ where: { key: { in: [...keys] } }, select: { id: true } });
  return rows.map((row) => ({ permissionId: row.id }));
}

export async function updateRole(id: string, input: { name?: string; description?: string; permissions?: string[] }, actorId: string) {
  const before = await prisma.role.findUnique({
    where: { id },
    include: { permissions: { select: { permission: { select: { key: true } } } } },
  });
  if (!before) throw Errors.notFound("نقش یافت نشد");
  if (before.code === "SUPER_ADMIN" && input.permissions) {
    throw Errors.conflict("دسترسی‌های مدیرکل قابل تغییر نیست");
  }
  const permissions = input.permissions?.filter((key): key is PermissionKey => (PERMISSIONS as readonly string[]).includes(key));
  const role = await prisma.$transaction(async (tx) => {
    const updated = await tx.role.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim().slice(0, 80) } : {}),
        ...(input.description !== undefined ? { description: input.description?.slice(0, 300) ?? null } : {}),
      },
    });
    if (permissions) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.rolePermission.createMany({ data: (await permissionIds(expandPermissionKeys(permissions))).map((row) => ({ ...row, roleId: id })), skipDuplicates: true });
    }
    return updated;
  });
  await audit({
    actorId, action: "role.updated", entity: "Role", entityId: id, severity: "critical",
    before: { name: before.name, permissions: before.permissions.map((entry) => entry.permission.key) },
    after: { name: role.name, permissions: permissions ?? before.permissions.map((entry) => entry.permission.key) },
  });
  return role;
}

export async function deleteRole(id: string, actorId: string) {
  const role = await prisma.role.findUnique({ where: { id }, select: { isSystem: true, code: true, _count: { select: { users: true } } } });
  if (!role) throw Errors.notFound("نقش یافت نشد");
  if (role.isSystem) throw Errors.conflict("نقش‌های سیستمی قابل حذف نیستند");
  if (role._count.users > 0) throw Errors.conflict("این نقش به کاربرانی اختصاص یافته است");
  await prisma.role.delete({ where: { id } });
  await audit({ actorId, action: "role.deleted", entity: "Role", entityId: id, severity: "critical", metadata: { code: role.code } });
}

export async function assignUserRole(userId: string, roleCode: string, actorId: string) {
  const [actor, target, role, superAdmins] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, phone: true } }),
    prisma.role.findUnique({ where: { code: roleCode }, select: { id: true, code: true } }),
    prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true } }),
  ]);
  if (!actor) throw Errors.unauthorized();
  if (!target) throw Errors.notFound("کاربر یافت نشد");
  if (!role) throw Errors.badRequest("نقش نامعتبر است");
  if (target.id === actorId) throw Errors.conflict("نمی‌توانید نقش خودتان را تغییر دهید");
  if ((role.code === "SUPER_ADMIN" || target.role === "SUPER_ADMIN") && actor.role !== "SUPER_ADMIN") {
    throw Errors.forbidden("فقط مدیرکل می‌تواند نقش مدیرکل را تغییر دهد");
  }
  if (target.role === "SUPER_ADMIN" && role.code !== "SUPER_ADMIN" && superAdmins <= 1) {
    throw Errors.conflict("باید حداقل یک مدیرکل فعال باقی بماند");
  }
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: userId }, data: { role: role.code }, select: { id: true, role: true, phone: true } });
    await tx.userRole.deleteMany({ where: { userId } });
    await tx.userRole.create({ data: { userId, roleId: role.id, assignedById: actorId } });
    return user;
  });
  await audit({
    actorId, action: "user.role_changed", entity: "User", entityId: userId, severity: "critical",
    before: { role: target.role }, after: { role: role.code },
  });
  return updated;
}

export async function setUserActive(userId: string, isActive: boolean, actorId: string) {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
  if (!target) throw Errors.notFound("کاربر یافت نشد");
  if (userId === actorId) throw Errors.conflict("حساب خودتان را نمی‌توانید غیرفعال کنید");
  if (!isActive && target.role === "SUPER_ADMIN") {
    const superAdmins = await prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true } });
    if (superAdmins <= 1) throw Errors.conflict("باید حداقل یک مدیرکل فعال باقی بماند");
  }
  const user = await prisma.user.update({ where: { id: userId }, data: { isActive }, select: { id: true, isActive: true } });
  if (!isActive) {
    await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  await audit({ actorId, action: isActive ? "user.activated" : "user.deactivated", entity: "User", entityId: userId, severity: "critical", before: { isActive: target.isActive }, after: { isActive } });
  return user;
}

export async function listActiveSessions(page = 1, pageSize = 25) {
  const where = { revokedAt: null, expiresAt: { gt: new Date() }, user: { role: { not: "CUSTOMER" } } };
  const [total, items] = await prisma.$transaction([
    prisma.session.count({ where }),
    prisma.session.findMany({
      where,
      orderBy: { lastUsedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, createdAt: true, expiresAt: true, lastUsedAt: true, ip: true, userAgent: true,
        user: { select: { id: true, phone: true, firstName: true, lastName: true, role: true } },
      },
    }),
  ]);
  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function revokeAdminSession(sessionId: string, actorId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId }, select: { userId: true, user: { select: { role: true } } } });
  if (!session) throw Errors.notFound("نشست یافت نشد");
  if (session.user.role === "CUSTOMER") throw Errors.forbidden("نشست مشتریان از این بخش قابل ابطال نیست");
  await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  await audit({ actorId, action: "session.revoked", entity: "Session", entityId: sessionId, severity: "critical", metadata: { userId: session.userId } });
}
