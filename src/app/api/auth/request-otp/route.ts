import { NextRequest } from "next/server";
import { ok, parseBody, route } from "@/lib/http";
import { clientIp } from "@/lib/http";
import { requestOtp } from "@/lib/auth/otp";
import { requestOtpSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  const input = await parseBody(request, requestOtpSchema);
  const result = await requestOtp(input.phone, clientIp(request));
  return ok(result);
});
