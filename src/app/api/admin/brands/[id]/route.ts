import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { brandSchema } from "@/lib/validation";
import { deleteBrand, updateBrand } from "@/services/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  const brand = await updateBrand(id, await parseBody(request, brandSchema));
  await audit({ actorId: user.id, action: "brand.updated", entity: "Brand", entityId: id });
  return ok({ id: brand.id });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  await deleteBrand(id);
  await audit({ actorId: user.id, action: "brand.deleted", entity: "Brand", entityId: id });
  return ok({ deleted: true });
});
