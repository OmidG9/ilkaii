import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { Errors } from "@/lib/errors";
import { requireUser } from "@/lib/auth/session";
import { ANALYTICS_COOKIE, ANALYTICS_CONSENT_COOKIE } from "@/lib/constants";
import { checkoutSchema } from "@/lib/validation";
import { createCheckout } from "@/services/checkout";
import { getAnalyticsSettings, getConsent } from "@/services/analytics";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser();
  const idempotencyKey = request.headers.get("x-idempotency-key");
  if (!idempotencyKey || !/^[a-zA-Z0-9_-]{16,80}$/.test(idempotencyKey)) {
    throw Errors.badRequest("کلید یکتای نامعتبر برای پرداخت");
  }
  const input = await parseBody(request, checkoutSchema);

  // Capture the anonymous session only when the customer has consented (or
  // when the operator runs consent-free first-party measurement).
  const store = await cookies();
  const sessionId = store.get(ANALYTICS_COOKIE)?.value ?? null;
  const settings = await getAnalyticsSettings();
  let analyticsSessionId: string | null = null;
  if (settings.enabled && sessionId) {
    const cookieConsent = store.get(ANALYTICS_CONSENT_COOKIE)?.value;
    const granted = !settings.requireConsent || cookieConsent === "all" || cookieConsent === "analytics" ||
      Boolean((await getConsent(sessionId, user.id))?.analytics);
    if (granted) analyticsSessionId = sessionId;
  }

  return ok(await createCheckout(input, user.id, idempotencyKey, { analyticsSessionId }), 201);
});
