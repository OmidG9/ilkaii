import { NextRequest } from "next/server";
import { assertSameOrigin, clientIp, ok, parseBody, route } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { newsletterSubscribeSchema } from "@/lib/validation";
import { subscribeNewsletter } from "@/services/marketing";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  if (!checkRateLimit(`newsletter:${clientIp(request)}`, 10, 15 * 60 * 1000).ok) {
    return ok({ status: "PENDING" }, 202);
  }
  const input = await parseBody(request, newsletterSubscribeSchema);
  return ok(await subscribeNewsletter(input), 201);
});
