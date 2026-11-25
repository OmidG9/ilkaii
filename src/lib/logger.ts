/** Structured logging with redaction of credentials and one-time secrets. */
const SECRET_KEYS = /^(otp|code|token|secret|password|authorization|cookie|apiKey|api_token|codeHash)$/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 3 || value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => sanitize(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [
        key,
        SECRET_KEYS.test(key) ? "[redacted]" : sanitize(val, depth + 1),
      ]),
    );
  }
  return value;
}

function emit(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({ level, message, meta: sanitize(meta ?? {}), time: new Date().toISOString() });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else if (process.env.NODE_ENV !== "production") console.info(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
};
