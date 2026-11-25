import { NextRequest } from "next/server";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { duplicateProduct } from "@/services/admin-products";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("products.create");
  const { id } = await (context as Context).params;
  const copy = await duplicateProduct(id, user.id);
  return ok(copy, 201);
});
