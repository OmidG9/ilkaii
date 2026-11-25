import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation";
import { deleteCategory, updateCategory } from "@/services/catalog";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  const category = await updateCategory(id, await parseBody(request, categorySchema));
  await audit({ actorId: user.id, action: "category.updated", entity: "Category", entityId: id });
  return ok({ id: category.id });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  await deleteCategory(id);
  await audit({ actorId: user.id, action: "category.deleted", entity: "Category", entityId: id });
  return ok({ deleted: true });
});
