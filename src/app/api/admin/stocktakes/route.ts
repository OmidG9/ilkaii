import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { stocktakeCreateSchema } from "@/lib/validation";
import { createStocktake } from "@/services/warehouse";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const input = await parseBody(request, stocktakeCreateSchema);
  const stocktake = await createStocktake(input, user.id);
  return ok({ id: stocktake.id, number: stocktake.number }, 201);
});
