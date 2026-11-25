export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  badRequest: (message = "درخواست نامعتبر است", details?: Record<string, unknown>) =>
    new AppError(400, "BAD_REQUEST", message, details),
  unauthorized: (message = "لطفاً وارد حساب خود شوید") =>
    new AppError(401, "UNAUTHORIZED", message),
  forbidden: (message = "دسترسی مجاز نیست") =>
    new AppError(403, "FORBIDDEN", message),
  notFound: (message = "یافت نشد") =>
    new AppError(404, "NOT_FOUND", message),
  conflict: (message = "تضاد با وضعیت فعلی") =>
    new AppError(409, "CONFLICT", message),
  tooMany: (message = "درخواستهای زیادی ارسال شده است") =>
    new AppError(429, "RATE_LIMITED", message),
  unavailable: (message = "سرویس موقتاً در دسترس نیست") =>
    new AppError(503, "UNAVAILABLE", message),
};

/** Never leak internal error messages to clients in production. */
export function publicError(error: unknown) {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        ok: false,
        error: { code: error.code, message: error.message, details: error.details },
      },
    };
  }
  if (process.env.NODE_ENV === "production") {
    return {
      status: 500,
      body: { ok: false, error: { code: "INTERNAL", message: "خطای داخلی سرور" } },
    };
  }
  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    },
  };
}
