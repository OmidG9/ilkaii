import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getServerEnv, isProduction } from "@/lib/env";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";

/**
 * Integration secrets are encrypted at rest with AES-256-GCM. The key is
 * derived from SESSION_SECRET; rotating that secret therefore requires
 * re-entering all integration credentials.
 *
 * Plaintext is only ever read by server-side provider adapters. The dashboard
 * receives a masked hint, never the value.
 */
const SECRET_KEYS = {
  "sms.api_token": { label: "توکن سرویس پیامک", group: "پیامک" },
  "sms.api_url": { label: "آدرس API پیامک", group: "پیامک" },
  "email.api_key": { label: "کلید API ایمیل", group: "ایمیل" },
  "email.from_address": { label: "آدرس فرستنده ایمیل", group: "ایمیل" },
  "payment.zarinpal_merchant_id": { label: "شناسه پذیرنده زرین‌پال", group: "پرداخت" },
  "payment.callback_secret": { label: "کلید امضای بازگشت پرداخت", group: "پرداخت" },
  "storage.cloudinary_api_secret": { label: "Secret کلادینری", group: "ذخیره‌سازی" },
  "storage.cloudinary_api_key": { label: "API Key کلادینری", group: "ذخیره‌سازی" },
} as const;

export type SecretKey = keyof typeof SECRET_KEYS;
export const SECRET_KEY_LIST = Object.entries(SECRET_KEYS).map(([key, meta]) => ({ key: key as SecretKey, ...meta }));

export function isSecretKey(value: string): value is SecretKey {
  return value in SECRET_KEYS;
}

function encryptionKey(): Buffer {
  return createHash("sha256").update(`ilkaii-secret-v1:${getServerEnv().SESSION_SECRET}`).digest();
}

export function maskSecret(value: string): string {
  if (value.length <= 6) return "••••••";
  return `${value.slice(0, 2)}••••••${value.slice(-2)}`;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [version, ivPart, tagPart, dataPart] = payload.split(".");
  if (version !== "v1" || !ivPart || !tagPart || !dataPart) throw new Error("Invalid secret payload");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, "base64url")), decipher.final()]).toString("utf8");
}

export async function listSecretMetadata() {
  const rows = await prisma.integrationSecret.findMany({ select: { key: true, maskedHint: true, updatedAt: true } });
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return SECRET_KEY_LIST.map((meta) => ({
    ...meta,
    configured: byKey.has(meta.key),
    maskedHint: byKey.get(meta.key)?.maskedHint ?? null,
    updatedAt: byKey.get(meta.key)?.updatedAt ?? null,
  }));
}

export async function getSecret(key: SecretKey): Promise<string | null> {
  const row = await prisma.integrationSecret.findUnique({ where: { key } });
  if (!row) return null;
  try {
    return decryptSecret(row.encryptedValue);
  } catch {
    throw Errors.unavailable("راز یکپارچه‌سازی قابل رمزگشایی نیست؛ SESSION_SECRET تغییر کرده است.");
  }
}

export async function setSecret(key: SecretKey, value: string, actorId: string) {
  if (!value.trim()) throw Errors.badRequest("مقدار راز خالی است");
  if (value.length > 2000) throw Errors.badRequest("مقدار راز بیش از حد طولانی است");
  const encryptedValue = encryptSecret(value.trim());
  await prisma.integrationSecret.upsert({
    where: { key },
    update: { encryptedValue, maskedHint: maskSecret(value.trim()), updatedById: actorId },
    create: { key, encryptedValue, maskedHint: maskSecret(value.trim()), updatedById: actorId },
  });
  await audit({ actorId, action: "secret.updated", entity: "IntegrationSecret", entityId: key, severity: "critical", metadata: { key } });
}

export async function deleteSecret(key: SecretKey, actorId: string) {
  await prisma.integrationSecret.deleteMany({ where: { key } });
  await audit({ actorId, action: "secret.deleted", entity: "IntegrationSecret", entityId: key, severity: "critical", metadata: { key } });
}

/** Refuse to use development adapters with production traffic. */
export function assertProductionAdapter(provider: string, isMock: boolean) {
  if (isProduction() && isMock) throw Errors.unavailable(`${provider} در محیط تولید پیکربندی نشده است.`);
}
