import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { ANALYTICS_COOKIE, ANALYTICS_CONSENT_COOKIE } from "@/lib/constants";
import { assertSameOrigin, clientIp, ok, parseBody, route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { analyticsConsentSchema } from "@/lib/validation";
import { setConsent } from "@/services/analytics";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const input = await parseBody(request, analyticsConsentSchema);
  const store = await cookies();
  let sessionId = store.get(ANALYTICS_COOKIE)?.value ?? "";
  if (!/^[a-f0-9]{32}$/.test(sessionId)) {
    sessionId = randomUUID().replace(/-/g, "");
    store.set(ANALYTICS_COOKIE, sessionId, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 90,
    });
  }
  if (!checkRateLimit(`consent:${clientIp(request)}`, 30, 60_000).ok) {
    return ok({ saved: false }, 202);
  }
  const user = await getSessionUser().catch(() => null);
  await setConsent({ sessionId, customerId: user?.id, analytics: input.analytics, marketing: input.marketing });
  store.set(ANALYTICS_CONSENT_COOKIE, input.analytics ? (input.marketing ? "all" : "analytics") : "none", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365,
  });
  return ok({ saved: true });
});
