import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { variantSchema } from "@/lib/validation";
import { upsertVariant } from "@/services/catalog";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("inventory.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, variantSchema);
  const variant = await upsertVariant(id, input, undefined, user.id);
  await audit({ actorId: user.id, action: "variant.created", entity: "ProductVariant", entityId: variant.id });
  return ok({ id: variant.id }, 201);
});
