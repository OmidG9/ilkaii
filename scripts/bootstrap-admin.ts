/**
 * Secure administrator bootstrap. There is no public admin registration route.
 * Usage: ADMIN_PHONE=09123456789 BOOTSTRAP_CONFIRM=yes npm run admin:grant
 * Optional: ADMIN_ROLE=ADMIN|ORDER_MANAGER|PRODUCT_MANAGER
 */
import "dotenv/config";
import { PrismaClient, type RoleCode } from "@prisma/client";
import { normalizeIranianPhone } from "../src/lib/persian";
import { ensureRolesAndPermissions } from "../src/lib/auth/bootstrap";

const prisma = new PrismaClient();
const ALLOWED: RoleCode[] = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "PRODUCT_MANAGER"];

async function main() {
  const rawPhone = process.env.ADMIN_PHONE ?? "";
  const phone = normalizeIranianPhone(rawPhone);
  const role = (process.env.ADMIN_ROLE ?? "SUPER_ADMIN") as RoleCode;
  if (process.env.BOOTSTRAP_CONFIRM !== "yes") {
    throw new Error("Bootstrap needs explicit confirmation: BOOTSTRAP_CONFIRM=yes");
  }
  if (!phone) throw new Error("A valid Iranian ADMIN_PHONE is required");
  if (!ALLOWED.includes(role)) throw new Error("Invalid ADMIN_ROLE");

  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, isVerified: true } });
  if (!user || !user.isVerified) {
    throw new Error("User must exist and be OTP-verified before receiving an admin role");
  }
  // Works in production where the demo seed is disabled.
  await ensureRolesAndPermissions();
  const roleRecord = await prisma.role.findUnique({ where: { code: role }, select: { id: true } });
  if (!roleRecord) throw new Error("Roles could not be provisioned");

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role } }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roleRecord.id } },
      update: {},
      create: { userId: user.id, roleId: roleRecord.id },
    }),
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
