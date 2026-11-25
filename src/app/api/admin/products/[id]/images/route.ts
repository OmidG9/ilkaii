import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { productImageSchema } from "@/lib/validation";
import { addProductImage } from "@/services/catalog";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, productImageSchema);
  const image = await addProductImage(id, input.url, input.altText, input.color, input.variantId);
  await audit({ actorId: user.id, action: "product.image_added", entity: "ProductImage", entityId: image.id });
  return ok({ id: image.id }, 201);
});
