import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { productSchema } from "@/lib/validation";
import { createProduct, makeSlug } from "@/services/catalog";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const input = await parseBody(request, productSchema);
  const product = await createProduct({ ...input, slug: input.slug || makeSlug(input.name) });
  await audit({ actorId: user.id, action: "product.created", entity: "Product", entityId: product.id, ip: request.headers.get("x-real-ip") });
  return ok({ id: product.id }, 201);
});
