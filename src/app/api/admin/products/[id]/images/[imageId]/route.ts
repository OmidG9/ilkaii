import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { Errors } from "@/lib/errors";
import { requirePermission } from "@/lib/auth/session";
import { deleteProductImage, setPrimaryImage } from "@/services/catalog";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; imageId: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id, imageId } = await (context as Context).params;
  await setPrimaryImage(id, imageId);
  await audit({ actorId: user.id, action: "product.image_primary", entity: "ProductImage", entityId: imageId });
  return ok({ primary: true });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id, imageId } = await (context as Context).params;
  if (!imageId || imageId.length > 64) throw Errors.badRequest("شناسه تصویر نامعتبر است");
  await deleteProductImage(id, imageId);
  await audit({ actorId: user.id, action: "product.image_deleted", entity: "ProductImage", entityId: imageId });
  return ok({ deleted: true });
});
