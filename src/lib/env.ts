import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  SMS_API_URL: z.string().url().optional(),
  SMS_API_TOKEN: z.string().min(1).optional(),
  PAYMENT_PROVIDER: z.enum(["MOCK", "ZARINPAL", "ZIBAL", "BEHPARDAKHT"]).default("MOCK"),
  ZARINPAL_MERCHANT_ID: z.string().min(1).optional(),
  // Production-safe default: a missing flag must never silently route real
  // customers to the sandbox. Local `.env` explicitly sets "true".
  ZARINPAL_SANDBOX: z.enum(["true", "false"]).default("false"),
  ZIBAL_MERCHANT: z.string().min(1).optional(),
  BEHPARDAKHT_TERMINAL_ID: z.string().min(1).optional(),
  BEHPARDAKHT_USERNAME: z.string().min(1).optional(),
  BEHPARDAKHT_PASSWORD: z.string().min(1).optional(),
  STORAGE_DRIVER: z.enum(["LOCAL", "CLOUDINARY"]).default("LOCAL"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  EMAIL_API_URL: z.string().url().optional(),
  // Optional distributed rate limiting for multi-instance deployments.
  REDIS_URL: z.string().url().optional(),
  // Persistent writable directory for local uploads (volume mount in production).
  LOCAL_UPLOAD_DIR: z.string().min(1).optional(),
  NEXT_PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

/**
 * Secrets are validated lazily so `next build` can compile without a live .env.
 * During the build phase only non-secret defaults are used; all runtime entry
 * points call this function before touching auth/payment/SMS providers.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  if (process.env.NEXT_PHASE === "phase-production-build") {
    cached = envSchema.parse({
      DATABASE_URL: "mysql://build:build@localhost:3306/ilkaii",
      SESSION_SECRET: "build-only-placeholder-not-used-at-runtime-0000",
    });
    return cached;
  }
  // Treat empty values as "not configured"; `.env.example` ships empty optional
  // keys and Zod's `.optional()` only accepts `undefined`.
  const raw = Object.fromEntries(
    Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value]),
  );
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const keys = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid server configuration: ${keys}. See .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}
