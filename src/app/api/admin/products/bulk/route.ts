import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { bulkProductAction } from "@/services/admin-products";
import { adminProductBulkSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("products.update", "products.create", "inventory.manage");
  const input = await parseBody(request, adminProductBulkSchema);
  return ok(await bulkProductAction(input, user.id));
});
