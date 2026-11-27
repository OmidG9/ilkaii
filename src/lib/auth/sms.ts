import { isProduction } from "@/lib/env";
import { logger } from "@/lib/logger";
import { getSecret } from "@/lib/secrets";

export interface SmsProvider {
  readonly name: string;
  sendOtp(phone: string, code: string): Promise<void>;
}

/**
 * Development-only in-memory store. It lives on globalThis because Next.js
 * bundles each route separately; a module-level Map would not be shared between
 * `/api/auth/request-otp` and `/api/auth/dev-otp`.
 */
const globalForDevSms = globalThis as unknown as {
  __ilkaiiDevOtp?: Map<string, { code: string; expiresAt: number }>;
};
const devCodes = globalForDevSms.__ilkaiiDevOtp ?? new Map();
globalForDevSms.__ilkaiiDevOtp = devCodes;

const devProvider: SmsProvider = {
  name: "dev-memory",
  async sendOtp(phone, code) {
    devCodes.set(phone, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
    // Deliberately not logged: OTP secrets never enter application logs.
  },
};

/** The dev endpoint is the only place this value is exposed, gated by NODE_ENV. */
export function getDevOtp(phone: string): string | null {
  if (isProduction()) return null;
  const entry = devCodes.get(phone);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.code;
}

class HttpSmsProvider implements SmsProvider {
  name = "http";
  constructor(
    private readonly url: string,
    private readonly token: string,
  ) {}

  async sendOtp(phone: string, code: string) {
    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ phone, code }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) {
      logger.error("sms_delivery_failed", { status: response.status });
      throw new Error("SMS delivery failed");
    }
  }
}

export async function getSmsProvider(): Promise<SmsProvider> {
  // Credentials saved in Admin → Settings → Integrations take precedence over
  // deployment env vars, so operators can rotate them without a restart.
  const [storedUrl, storedToken] = await Promise.all([
    getSecret("sms.api_url").catch(() => null),
    getSecret("sms.api_token").catch(() => null),
  ]);
  const url = storedUrl || process.env.SMS_API_URL;
  const token = storedToken || process.env.SMS_API_TOKEN;

  if (url && token) return new HttpSmsProvider(url, token);
  // Fail closed: production never falls back to the dev provider.
  if (isProduction()) throw new Error("SMS provider is not configured (SMS_API_URL, SMS_API_TOKEN)");
  return devProvider;
}
