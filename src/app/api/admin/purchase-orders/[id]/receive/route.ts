import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { purchaseOrderReceiveSchema } from "@/lib/validation";
import { receivePurchaseOrder } from "@/services/warehouse";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, purchaseOrderReceiveSchema);
  const result = await receivePurchaseOrder(id, input, user.id);
  return ok(result, 201);
});
