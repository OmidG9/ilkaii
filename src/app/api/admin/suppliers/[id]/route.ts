import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { supplierUpdateSchema } from "@/lib/validation";
import { deleteSupplier, updateSupplier } from "@/services/warehouse";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, supplierUpdateSchema);
  const supplier = await updateSupplier(id, input, user.id);
  return ok({ id: supplier.id });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const { id } = await (context as Context).params;
  await deleteSupplier(id, user.id);
  return ok({ deleted: true });
});
