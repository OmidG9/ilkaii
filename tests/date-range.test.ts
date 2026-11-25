import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, resolveDateRange, tehranDayStart, toIsoDay, rangeSearchParams, isValidRangeKey } from "../src/lib/date-range";

const now = new Date("2026-11-25T12:00:00.000Z"); // 15:30 Tehran

test("resolveDateRange understands named ranges in Tehran", () => {
  const today = resolveDateRange({ range: "today" }, now);
  assert.equal(today.key, "today");
  assert.equal(toIsoDay(today.from), "2026-11-25");
  assert.ok(today.to >= today.from);

  const yesterday = resolveDateRange({ range: "yesterday" }, now);
  assert.equal(toIsoDay(yesterday.from), "2026-11-24");
  assert.ok(yesterday.to < tehranDayStart(now));

  const week = resolveDateRange({ range: "7d" }, now);
  assert.equal(week.days, 7);
  const month = resolveDateRange({ range: "this_month" }, now);
  assert.equal(toIsoDay(month.from), "2026-11-01");
  const last = resolveDateRange({ range: "last_month" }, now);
  assert.equal(toIsoDay(last.from), "2026-10-01");
});

test("custom range parses inclusive Tehran days and builds a previous period", () => {
  const range = resolveDateRange({ range: "custom", from: "2026-11-01", to: "2026-11-10" }, now);
  assert.equal(toIsoDay(range.from), "2026-11-01");
  assert.equal(toIsoDay(range.to), "2026-11-10");
  assert.equal(range.days, 10);
  assert.ok(range.previousTo < range.from);
  assert.equal(Math.round((range.previousTo.getTime() - range.previousFrom.getTime() + 1) / (24 * 60 * 60 * 1000)), 10);
});

test("invalid custom ranges fall back to the default 30-day window", () => {
  const range = resolveDateRange({ range: "custom", from: "bad", to: "2026-11-10" }, now);
  assert.equal(range.key, "custom");
  assert.equal(range.days, 30);
  assert.equal(isValidRangeKey("custom"), true);
  assert.equal(isValidRangeKey("nope"), false);
});

test("rangeSearchParams round-trips custom days", () => {
  const range = resolveDateRange({ range: "custom", from: "2026-11-01", to: "2026-11-10" }, now);
  const params = rangeSearchParams(range);
  assert.equal(params.range, "custom");
  assert.equal(params.from, "2026-11-01");
  assert.equal(params.to, "2026-11-10");
});

test("addDays and tehranDayStart handle the Tehran offset", () => {
  const start = tehranDayStart(new Date("2026-11-25T00:00:00.000Z"));
  assert.equal(start.toISOString(), "2026-11-24T20:30:00.000Z");
  assert.equal(toIsoDay(addDays(start, 1)), "2026-11-26");
});
