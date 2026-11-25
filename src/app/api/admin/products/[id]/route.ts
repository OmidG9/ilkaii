import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation";
import { deleteProduct, updateProduct } from "@/services/catalog";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, productSchema);
  const product = await updateProduct(id, input);
  await audit({ actorId: user.id, action: "product.updated", entity: "Product", entityId: id, metadata: { name: product.name } });
  return ok({ id: product.id });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  await deleteProduct(id);
  await audit({ actorId: user.id, action: "product.archived", entity: "Product", entityId: id });
  return ok({ archived: true });
});
