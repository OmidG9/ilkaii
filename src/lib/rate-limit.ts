import { createHash } from "node:crypto";
import Redis from "ioredis";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Process-local fallback. It is correct for a single Node process; a
 * multi-instance deployment should set REDIS_URL so every instance shares the
 * same counters.
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

function memoryCheck(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  if (buckets.size >= MAX_BUCKETS) prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count += 1;
  const ok = bucket.count <= limit;
  if (!ok) logger.warn("rate_limit_exceeded", { key: key.split(":")[0] });
  return { ok, remaining: Math.max(0, limit - bucket.count) };
}

/*
 * Atomic increment + first-hit expiry. Using Lua avoids a race where two
 * instances both set a shorter TTL, and guarantees a counter cannot be left
 * without an expiry if a process dies between commands.
 */
const REDIS_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return current
`;

let redis: Redis | null = null;
let redisUnavailableUntil = 0;
const REDIS_RETRY_AFTER_MS = 30_000;

function redisClient(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (attempt) => Math.min(attempt * 500, 5_000),
    });
    redis.on("error", (error) => {
      logger.warn("redis_rate_limit_error", { error: error instanceof Error ? error.message : String(error) });
    });
  }
  return redis;
}

function redisKey(key: string) {
  // Do not put phone numbers/IPs in Redis keys.
  return `ilkaii:rl:${createHash("sha256").update(key).digest("hex")}`;
}

async function redisCheck(key: string, limit: number, windowMs: number) {
  const client = redisClient();
  if (!client || Date.now() < redisUnavailableUntil) return null;
  try {
    const count = Number(await client.eval(REDIS_SCRIPT, 1, redisKey(key), String(windowMs)));
    const ok = count <= limit;
    if (!ok) logger.warn("rate_limit_exceeded", { key: key.split(":")[0], driver: "redis" });
    return { ok, remaining: Math.max(0, limit - count) };
  } catch (error) {
    // Degrade to the per-process limiter for a short period instead of failing
    // every login/newsletter request when Redis is temporarily unavailable.
    redisUnavailableUntil = Date.now() + REDIS_RETRY_AFTER_MS;
    logger.warn("rate_limit_redis_unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Async because the Redis driver is network-bound. Without REDIS_URL this is
 * an in-process sliding-window bucket (single-instance only).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number }> {
  return (await redisCheck(key, limit, windowMs)) ?? memoryCheck(key, limit, windowMs);
}

export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  if (!(await checkRateLimit(key, limit, windowMs)).ok) throw Errors.tooMany();
}

export const OTP_REQUEST_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
export const OTP_VERIFY_LIMIT = { limit: 8, windowMs: 15 * 60 * 1000 };
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
