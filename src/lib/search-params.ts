export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Next.js 15 passes searchParams as a Promise; normalize repeated keys safely. */
export function normalizeSearchParams(raw: RawSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") result[key] = value;
    else if (Array.isArray(value) && value[0]) result[key] = value[0];
  }
  return result;
}
