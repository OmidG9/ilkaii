import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { inventoryVariantUpdateSchema } from "@/lib/validation";
import { updateVariantSettings } from "@/services/warehouse";

export const runtime = "nodejs";
type Context = { params: Promise<{ variantId: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const { variantId } = await (context as Context).params;
  const input = await parseBody(request, inventoryVariantUpdateSchema);
  const variant = await updateVariantSettings(variantId, input, user.id);
  return ok({ id: variant.id });
});
