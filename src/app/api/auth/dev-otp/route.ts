import { NextRequest } from "next/server";
import { isProduction } from "@/lib/env";
import { ok, route } from "@/lib/http";
import { normalizeIranianPhone } from "@/lib/persian";
import { getDevOtp } from "@/lib/auth/sms";

export const runtime = "nodejs";

/** Development-only helper for local E2E tests; 404 in production. */
export const GET = route(async (request: NextRequest) => {
  if (isProduction()) return new Response(null, { status: 404 });
  const phone = normalizeIranianPhone(request.nextUrl.searchParams.get("phone") ?? "");
  return ok({ otp: phone ? getDevOtp(phone) : null });
});
