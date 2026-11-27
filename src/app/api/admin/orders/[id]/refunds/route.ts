import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { refundSchema } from "@/lib/validation";
import { registerRefund } from "@/services/refunds";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("order.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, refundSchema);
  const refund = await registerRefund(id, input, user.id);
  return ok({ id: refund.id }, 201);
});
