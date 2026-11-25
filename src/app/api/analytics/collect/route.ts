import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { ANALYTICS_COOKIE, ANALYTICS_CONSENT_COOKIE } from "@/lib/constants";
import { assertSameOrigin, clientIp, ok, parseBody, route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyticsEventSchema } from "@/lib/validation";
import { getAnalyticsSettings, getConsent, recordAnalyticsEvent } from "@/services/analytics";

export const runtime = "nodejs";

function consentFromCookie(value: string | undefined) {
  return value === "all" || value === "analytics";
}

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const payload = await parseBody(request, analyticsEventSchema);

  const store = await cookies();
  let sessionId = store.get(ANALYTICS_COOKIE)?.value ?? "";
  if (!/^[a-f0-9]{32}$/.test(sessionId)) {
    sessionId = randomUUID().replace(/-/g, "");
    store.set(ANALYTICS_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
  }

  const ip = clientIp(request);
  if (!checkRateLimit(`analytics:${sessionId}`, 180, 60_000).ok || !checkRateLimit(`analytics-ip:${ip}`, 600, 60_000).ok) {
    return ok({ recorded: false, reason: "rate_limited" }, 202);
  }

  const settings = await getAnalyticsSettings();
  let consentGranted = !settings.requireConsent || consentFromCookie(store.get(ANALYTICS_CONSENT_COOKIE)?.value);
  const user = await getSessionUser().catch(() => null);
  if (settings.requireConsent && !consentGranted) {
    const consent = await getConsent(sessionId, user?.id).catch(() => null);
    consentGranted = Boolean(consent?.analytics);
  }

  const result = await recordAnalyticsEvent(payload, {
    sessionId,
    customerId: user?.id ?? null,
    ip,
    userAgent: request.headers.get("user-agent"),
    consentGranted,
  });
  return ok(result, 202);
});
