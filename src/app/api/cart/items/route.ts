import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { cartAddSchema } from "@/lib/validation";
import { addToCart } from "@/services/cart";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const input = await parseBody(request, cartAddSchema);
  return ok(await addToCart(input), 201);
});
