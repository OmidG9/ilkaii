import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { supplierSchema } from "@/lib/validation";
import { createSupplier } from "@/services/warehouse";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const input = await parseBody(request, supplierSchema);
  const supplier = await createSupplier(input, user.id);
  return ok({ id: supplier.id }, 201);
});
