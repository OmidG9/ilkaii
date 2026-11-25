import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { CART_COOKIE } from "@/lib/constants";
import { assertSameOrigin, clientIp, ok, parseBody, route } from "@/lib/http";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession, revokeSession } from "@/lib/auth/session";
import { mergeGuestCart } from "@/services/cart";
import { verifyOtpSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const input = await parseBody(request, verifyOtpSchema);
  const user = await verifyOtp(input.phone, input.otp, clientIp(request));
  const guestToken = (await cookies()).get(CART_COOKIE)?.value ?? null;
  await revokeSession();
  await createSession(user.id);
  await mergeGuestCart(guestToken, user.id);
  return ok({ id: user.id, phone: user.phone, role: user.role, firstName: user.firstName, lastName: user.lastName });
});
