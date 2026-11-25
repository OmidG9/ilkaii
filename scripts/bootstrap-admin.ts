/**
 * Secure administrator bootstrap. There is no public admin registration route.
 * Usage: ADMIN_PHONE=09123456789 BOOTSTRAP_CONFIRM=yes npm run admin:grant
 * Optional: ADMIN_ROLE=SUPER_ADMIN|ADMIN|PRODUCT_MANAGER|ORDER_MANAGER|CONTENT_MANAGER|MARKETING_MANAGER|ANALYST|SUPPORT_AGENT
 * Custom roles that already exist in the Role table are also accepted.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { normalizeIranianPhone } from "../src/lib/persian";
import { ensureRolesAndPermissions } from "../src/lib/auth/bootstrap";
import { BUILT_IN_ROLES } from "../src/lib/permissions";

const prisma = new PrismaClient();
const ALLOWED: readonly string[] = BUILT_IN_ROLES.filter((role) => role !== "CUSTOMER");

async function main() {
  const rawPhone = process.env.ADMIN_PHONE ?? "";
  const phone = normalizeIranianPhone(rawPhone);
  const role = process.env.ADMIN_ROLE ?? "SUPER_ADMIN";
  if (process.env.BOOTSTRAP_CONFIRM !== "yes") {
    throw new Error("Bootstrap needs explicit confirmation: BOOTSTRAP_CONFIRM=yes");
  }
  if (!phone) throw new Error("A valid Iranian ADMIN_PHONE is required");

  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, isVerified: true } });
  if (!user || !user.isVerified) {
    throw new Error("User must exist and be OTP-verified before receiving an admin role");
  }
  // Works in production where the demo seed is disabled.
  await ensureRolesAndPermissions();
  if (!ALLOWED.includes(role)) {
    const custom = await prisma.role.findUnique({ where: { code: role }, select: { id: true } });
    if (!custom) throw new Error("Invalid ADMIN_ROLE");
  }
  const roleRecord = await prisma.role.findUnique({ where: { code: role }, select: { id: true } });
  if (!roleRecord) throw new Error("Roles could not be provisioned");

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role } }),
    prisma.userRole.deleteMany({ where: { userId: user.id } }),
    prisma.userRole.create({ data: { userId: user.id, roleId: roleRecord.id } }),
    prisma.auditLog.create({
      data: { actorId: user.id, actorPhone: phone, action: "admin.granted", entity: "User", entityId: user.id, metadata: JSON.stringify({ role }) },
    }),
  ]);
  console.log(`Granted ${role} to ${phone}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
