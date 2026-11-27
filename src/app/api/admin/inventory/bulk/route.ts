import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { inventoryBulkSchema } from "@/lib/validation";
import { bulkAdjustStock } from "@/services/warehouse";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const input = await parseBody(request, inventoryBulkSchema);
  const result = await bulkAdjustStock(input, user.id);
  return ok(result, 201);
});
