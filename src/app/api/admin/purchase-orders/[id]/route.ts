import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { purchaseOrderUpdateSchema } from "@/lib/validation";
import { updatePurchaseOrder } from "@/services/warehouse";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, purchaseOrderUpdateSchema);
  await updatePurchaseOrder(id, input, user.id);
  return ok({ updated: true });
});
