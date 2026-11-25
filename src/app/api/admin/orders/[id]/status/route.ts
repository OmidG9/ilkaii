import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { orderStatusSchema } from "@/lib/validation";
import { updateOrderStatus } from "@/services/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("order.write");
  const { id } = await (context as Context).params;
  return ok(await updateOrderStatus(id, await parseBody(request, orderStatusSchema), user.id));
});
