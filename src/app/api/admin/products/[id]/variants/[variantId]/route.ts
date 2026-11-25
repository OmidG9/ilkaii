import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { variantSchema } from "@/lib/validation";
import { deleteVariant, upsertVariant } from "@/services/catalog";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; variantId: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("inventory.write");
  const { id, variantId } = await (context as Context).params;
  const input = await parseBody(request, variantSchema);
  const variant = await upsertVariant(id, input, variantId);
  await audit({ actorId: user.id, action: "variant.updated", entity: "ProductVariant", entityId: variantId, metadata: { stock: input.stock } });
  return ok({ id: variant.id });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("inventory.write");
  const { id, variantId } = await (context as Context).params;
  await deleteVariant(id, variantId);
  await audit({ actorId: user.id, action: "variant.deleted", entity: "ProductVariant", entityId: variantId });
  return ok({ deleted: true });
});
