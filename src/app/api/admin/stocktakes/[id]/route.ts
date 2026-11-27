import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { stocktakeCountsSchema } from "@/lib/validation";
import { saveStocktakeCounts } from "@/services/warehouse";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, stocktakeCountsSchema);
  const result = await saveStocktakeCounts(id, input, user.id);
  return ok(result);
});
