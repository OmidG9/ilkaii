/**
 * Dashboard date ranges are calculated in Asia/Tehran (UTC+03:30, no DST since
 * 2022). Database timestamps stay UTC; boundaries are converted once here.
 */
export const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const RANGE_KEYS = ["today", "yesterday", "7d", "30d", "this_month", "last_month", "custom"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const RANGE_LABELS: Record<RangeKey, string> = {
  today: "امروز",
  yesterday: "دیروز",
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
  this_month: "این ماه",
  last_month: "ماه گذشته",
  custom: "بازه دلخواه",
};

export interface DateRange {
  key: RangeKey;
  /** Inclusive UTC instant. */
  from: Date;
  /** Inclusive UTC instant (last millisecond of the selected day). */
  to: Date;
  /** Same-length period immediately before `from`, for comparisons. */
  previousFrom: Date;
  previousTo: Date;
  days: number;
}

function tehranParts(date: Date) {
  const shifted = new Date(date.getTime() + TEHRAN_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

export function tehranDayStart(date: Date): Date {
  const parts = tehranParts(date);
  return new Date(Date.UTC(parts.year, parts.month, parts.day) - TEHRAN_OFFSET_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function addMonths(date: Date, months: number): Date {
  const parts = tehranParts(date);
  return new Date(Date.UTC(parts.year, parts.month + months, parts.day) - TEHRAN_OFFSET_MS);
}

function parseTehranDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day) - TEHRAN_OFFSET_MS);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isValidRangeKey(value: string | undefined): value is RangeKey {
  return !!value && (RANGE_KEYS as readonly string[]).includes(value);
}

export function resolveDateRange(input: { range?: string; from?: string; to?: string }, now = new Date()): DateRange {
  const key: RangeKey = isValidRangeKey(input.range) ? input.range : "30d";
  const today = tehranDayStart(now);
  let from = addDays(today, -29);
  let to = now;

  if (key === "today") {
    from = today;
  } else if (key === "yesterday") {
    from = addDays(today, -1);
    to = new Date(today.getTime() - 1);
  } else if (key === "7d") {
    from = addDays(today, -6);
  } else if (key === "30d") {
    from = addDays(today, -29);
  } else if (key === "this_month") {
    const parts = tehranParts(now);
    from = new Date(Date.UTC(parts.year, parts.month, 1) - TEHRAN_OFFSET_MS);
  } else if (key === "last_month") {
    const parts = tehranParts(now);
    from = new Date(Date.UTC(parts.year, parts.month - 1, 1) - TEHRAN_OFFSET_MS);
    to = new Date(Date.UTC(parts.year, parts.month, 1) - TEHRAN_OFFSET_MS - 1);
  } else {
    const customFrom = parseTehranDate(input.from);
    const customTo = parseTehranDate(input.to);
    if (customFrom && customTo && customFrom <= customTo) {
      from = customFrom;
      to = new Date(customTo.getTime() + DAY_MS - 1);
    }
  }

  const span = Math.max(DAY_MS, to.getTime() - from.getTime() + 1);
  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(from.getTime() - span);
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime() + 1) / DAY_MS));
  return { key, from, to, previousFrom, previousTo, days };
}

/** Query-string representation used by date range links. */
export function rangeSearchParams(range: DateRange): Record<string, string> {
  if (range.key !== "custom") return { range: range.key };
  const toDate = new Date(range.to.getTime() - DAY_MS + 1);
  return {
    range: "custom",
    from: toIsoDay(range.from),
    to: toIsoDay(toDate),
  };
}

export function toIsoDay(date: Date): string {
  const shifted = new Date(date.getTime() + TEHRAN_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}
