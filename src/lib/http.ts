import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError, publicError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { recordSystemEvent } from "@/services/system";

const MAX_BODY_BYTES = 64 * 1024;

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: unknown) {
  const { status, body } = publicError(error);
  if (status >= 500) {
    logger.error("api_error", { error: error instanceof Error ? error.message : String(error) });
    void recordSystemEvent("error", "api", error instanceof Error ? error.message : String(error));
  }
  return NextResponse.json(body, { status });
}

export async function parseBody<T extends z.ZodTypeAny>(request: Request, schema: T): Promise<z.infer<T>> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) throw new AppError(413, "PAYLOAD_TOO_LARGE", "حجم درخواست بیش از حد مجاز است");
  let json: unknown;
  try {
    json = raw ? JSON.parse(raw) : {};
  } catch {
    throw new AppError(400, "INVALID_JSON", "بدنه درخواست معتبر نیست");
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new AppError(400, "VALIDATION_ERROR", "اطلاعات وارد شده معتبر نیست", {
      fields: result.error.flatten().fieldErrors,
    });
  }
  return result.data;
}

export function parseQuery<T extends z.ZodTypeAny>(request: NextRequest, schema: T): z.infer<T> {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "پارامترهای نامعتبر", {
    fields: result.error.flatten().fieldErrors,
  });
  return result.data;
}

/** Cookie-authenticated mutations must originate from our own site. */
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return; // Non-browser clients (gateway callbacks) are handled separately.
  const allowed = new Set([
    request.headers.get("host") ?? "",
    new URL(request.url).host,
    process.env.NEXT_PUBLIC_BASE_URL ? new URL(process.env.NEXT_PUBLIC_BASE_URL).host : "",
  ]);
  try {
    if (!allowed.has(new URL(origin).host) || new URL(origin).protocol !== "https" && !origin.startsWith("http://localhost")) {
      throw new AppError(403, "CSRF_REJECTED", "درخواست از مبدأ نامعتبر");
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(403, "CSRF_REJECTED", "درخواست از مبدأ نامعتبر");
  }
}

export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.slice(0, 64);
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim().slice(0, 64) ?? "unknown";
}

export function route(handler: (request: NextRequest, context?: unknown) => Promise<Response>) {
  return async (request: NextRequest, context?: unknown) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return fail(error);
    }
  };
}
