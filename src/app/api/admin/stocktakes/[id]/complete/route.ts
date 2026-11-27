import { NextRequest } from "next/server";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { requireAnyPermission } from "@/lib/auth/session";
import { completeStocktake } from "@/services/warehouse";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("inventory.manage", "inventory.write");
  const { id } = await (context as Context).params;
  const result = await completeStocktake(id, user.id);
  return ok(result);
});
