import { NextRequest } from "next/server";
import { assertSameOrigin, clientIp, ok, parseBody, route } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { newsletterUnsubscribeSchema } from "@/lib/validation";
import { unsubscribeNewsletter } from "@/services/marketing";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  if (!(await checkRateLimit(`unsubscribe:${clientIp(request)}`, 20, 15 * 60 * 1000)).ok) {
    return ok({ unsubscribed: false }, 202);
  }
  const input = await parseBody(request, newsletterUnsubscribeSchema);
  return ok(await unsubscribeNewsletter(input.token));
});
