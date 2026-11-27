import { randomInt } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { assertRateLimit, OTP_REQUEST_LIMIT, OTP_RESEND_COOLDOWN_MS, OTP_VERIFY_LIMIT } from "@/lib/rate-limit";
import { ensureRolesAndPermissions } from "@/lib/auth/bootstrap";
import { getSmsProvider } from "@/lib/auth/sms";

const OTP_TTL_MS = 10 * 60 * 1000;

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Generic response: never reveals whether a phone has an account. */
export async function requestOtp(phone: string, ip: string) {
  await assertRateLimit(`otp-request:${phone}`, OTP_REQUEST_LIMIT.limit, OTP_REQUEST_LIMIT.windowMs);
  await assertRateLimit(`otp-request-ip:${ip}`, 20, 15 * 60 * 1000);

  const previous = await prisma.otpChallenge.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (previous && Date.now() - previous.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw Errors.conflict("لطفاً قبل از ارسال مجدد کد، کمی صبر کنید");
  }

  await ensureRolesAndPermissions();
  const code = generateOtp();
  const codeHash = await hash(code, 10);
  await prisma.$transaction([
    prisma.otpChallenge.deleteMany({ where: { phone } }),
    prisma.otpChallenge.create({
      data: {
        phone,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    }),
  ]);

  await (await getSmsProvider()).sendOtp(phone, code);
  return { sent: true, retryAfterSeconds: OTP_RESEND_COOLDOWN_MS / 1000 };
}

export async function verifyOtp(phone: string, otp: string, ip: string) {
  await assertRateLimit(`otp-verify:${phone}`, OTP_VERIFY_LIMIT.limit, OTP_VERIFY_LIMIT.windowMs);
  await assertRateLimit(`otp-verify-ip:${ip}`, 30, 15 * 60 * 1000);

  const challenge = await prisma.otpChallenge.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
  if (!challenge || challenge.consumedAt || challenge.expiresAt < new Date()) {
    throw Errors.badRequest("کد تأیید نامعتبر یا منقضی شده است");
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    throw Errors.tooMany("تعداد تلاشها بیش از حد مجاز است");
  }

  const matches = await compare(otp, challenge.codeHash);
  if (!matches) {
    await prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    throw Errors.badRequest("کد تأیید نادرست است");
  }

  // Atomic consumption protects against concurrent verification replays.
  const consumed = await prisma.otpChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (consumed.count === 0) throw Errors.badRequest("کد تأیید قبلاً استفاده شده است");

  // A suspended account must never reactivate itself by logging in again.
  const existing = await prisma.user.findUnique({ where: { phone }, select: { isActive: true } });
  if (existing && !existing.isActive) {
    throw Errors.forbidden("حساب شما غیرفعال شده است. برای پیگیری با پشتیبانی تماس بگیرید.");
  }

  await ensureRolesAndPermissions();
  const customerRole = await prisma.role.findUnique({ where: { code: "CUSTOMER" }, select: { id: true } });
  if (!customerRole) throw Errors.unavailable("نقشهای سیستم مقداردهی نشدهاند");

  const user = await prisma.user.upsert({
    where: { phone },
    update: { isVerified: true, lastLogin: new Date() },
    create: {
      phone,
      isVerified: true,
      lastLogin: new Date(),
      role: "CUSTOMER",
      roles: { create: { roleId: customerRole.id } },
    },
    select: { id: true, phone: true, role: true, firstName: true, lastName: true },
  });
  return user;
}
