import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { assertRateLimit, checkRateLimit } from "../src/lib/rate-limit";
import { AppError } from "../src/lib/errors";

// These tests exercise the in-process fallback. Redis itself is covered by the
// deployment smoke test; the fallback must keep OTP/analytics working without it.
delete process.env.REDIS_URL;

test("memory rate limiter allows the limit and rejects the next request", async () => {
  const key = `test:${randomUUID()}`;
  assert.equal((await checkRateLimit(key, 3, 60_000)).ok, true);
  assert.equal((await checkRateLimit(key, 3, 60_000)).ok, true);
  assert.equal((await checkRateLimit(key, 3, 60_000)).ok, true);
  const blocked = await checkRateLimit(key, 3, 60_000);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.remaining, 0);
});

test("different keys do not share buckets", async () => {
  const first = `test:${randomUUID()}`;
  const second = `test:${randomUUID()}`;
  assert.equal((await checkRateLimit(first, 1, 60_000)).ok, true);
  assert.equal((await checkRateLimit(first, 1, 60_000)).ok, false);
  assert.equal((await checkRateLimit(second, 1, 60_000)).ok, true);
});

test("the window resets", async () => {
  const key = `test:${randomUUID()}`;
  assert.equal((await checkRateLimit(key, 1, 25)).ok, true);
  assert.equal((await checkRateLimit(key, 1, 25)).ok, false);
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal((await checkRateLimit(key, 1, 25)).ok, true);
});

test("assertRateLimit throws a 429 AppError", async () => {
  const key = `test:${randomUUID()}`;
  await assertRateLimit(key, 1, 60_000);
  await assert.rejects(() => assertRateLimit(key, 1, 60_000), (error: unknown) => {
    return error instanceof AppError && error.status === 429;
  });
});
