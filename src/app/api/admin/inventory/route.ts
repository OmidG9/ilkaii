import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { invalidateCache } from "@/lib/cache";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { inventoryAdjustmentSchema } from "@/lib/validation";
import { adjustStock } from "@/services/catalog";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const input = await parseBody(request, inventoryAdjustmentSchema);
  await adjustStock({ ...input, userId: user.id });
  await audit({
    actorId: user.id,
    action: "inventory.adjusted",
    entity: "ProductVariant",
    entityId: input.variantId,
    metadata: { quantity: input.quantity, reason: input.reason },
  });
  invalidateCache("dashboard:");
  return ok({ adjusted: true }, 201);
});
