import { NextRequest } from "next/server";
import { ok, parseQuery, route } from "@/lib/http";
import { productQuerySchema } from "@/lib/validation";
import { listProducts } from "@/services/catalog";

export const runtime = "nodejs";

export const GET = route(async (request: NextRequest) => {
  return ok(await listProducts(parseQuery(request, productQuerySchema)));
});
