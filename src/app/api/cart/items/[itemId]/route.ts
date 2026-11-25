import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { cartUpdateSchema } from "@/lib/validation";
import { removeCartItem, updateCartItem } from "@/services/cart";

export const runtime = "nodejs";

type Context = { params: Promise<{ itemId: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const { itemId } = await (context as Context).params;
  const input = await parseBody(request, cartUpdateSchema);
  return ok(await updateCartItem(itemId, input));
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const { itemId } = await (context as Context).params;
  return ok(await removeCartItem(itemId));
});
