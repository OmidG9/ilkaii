import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { Errors } from "@/lib/errors";
import { requireUser } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validation";
import { createCheckout } from "@/services/checkout";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser();
  const idempotencyKey = request.headers.get("x-idempotency-key");
  if (!idempotencyKey || !/^[a-zA-Z0-9_-]{16,80}$/.test(idempotencyKey)) {
    throw Errors.badRequest("کلید یکتای نامعتبر برای پرداخت");
  }
  const input = await parseBody(request, checkoutSchema);
  return ok(await createCheckout(input, user.id, idempotencyKey), 201);
});
