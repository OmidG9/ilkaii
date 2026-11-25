/** Persian-first helpers: digits, phone/postal validation, Jalali dates and search normalization. */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
}

/** Normalize to the canonical Iranian mobile form: 09123456789. */
export function normalizeIranianPhone(input: string): string | null {
  const digits = normalizeDigits(input).replace(/[^\d]/g, "");
  let local = digits;
  if (/^989\d{9}$/.test(digits)) local = `0${digits.slice(2)}`;
  else if (/^00989\d{9}$/.test(digits)) local = `0${digits.slice(4)}`;
  else if (/^9\d{9}$/.test(digits)) local = `0${digits}`;
  return /^09\d{9}$/.test(local) ? local : null;
}

export function isValidIranianPhone(input: string): boolean {
  return normalizeIranianPhone(input) !== null;
}

export function isValidPostalCode(input: string): boolean {
  const digits = normalizeDigits(input).replace(/[^\d]/g, "");
  return /^\d{10}$/.test(digits);
}

/** Unify Persian/Arabic variants so "یک" and "یک" search identically. */
export function normalizeForSearch(input: string): string {
  return normalizeDigits(input)
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[\s\u200c\u200d]/g, " ")
    .replace(/ة/g, "ه")
    .replace(/أ|إ|آ/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ی")
    .trim()
    .toLowerCase();
}

export function formatJalali(date: Date | string, withTime = false): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" } : {}),
  });
  return formatter.format(value);
}

export function formatNumber(value: number | string): string {
  return new Intl.NumberFormat("fa-IR").format(Number(value));
}

export function toEnglishDigits(input: string): string {
  return normalizeDigits(input);
}
