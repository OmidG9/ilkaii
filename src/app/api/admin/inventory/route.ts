import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { inventoryAdjustmentSchema } from "@/lib/validation";
import { adjustStock } from "@/services/catalog";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("inventory.write");
  const input = await parseBody(request, inventoryAdjustmentSchema);
  await adjustStock({ ...input, userId: user.id });
  await audit({ actorId: user.id, action: "inventory.adjusted", entity: "ProductVariant", entityId: input.variantId, metadata: { quantity: input.quantity, reason: input.reason } });
  return ok({ adjusted: true }, 201);
});
