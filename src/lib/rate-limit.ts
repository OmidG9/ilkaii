import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Process-local sliding-window limiter. Suitable for a single Node process;
 * multi-instance deployments should replace `checkRateLimit` with Redis/DB.
 */
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Evict expired entries so random keys cannot exhaust process memory. */
function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still oversized after pruning: drop everything rather than grow without bound.
  if (buckets.size >= MAX_BUCKETS) buckets.clear();
}

export function checkRateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  if (buckets.size >= MAX_BUCKETS) prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const fresh = { count: 1, resetAt: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  const ok = bucket.count <= limit;
  if (!ok) logger.warn("rate_limit_exceeded", { key: key.split(":")[0] });
  return { ok, remaining: Math.max(0, limit - bucket.count) };
}

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  if (!checkRateLimit(key, limit, windowMs).ok) throw Errors.tooMany();
}

export const OTP_REQUEST_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
export const OTP_VERIFY_LIMIT = { limit: 8, windowMs: 15 * 60 * 1000 };
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
