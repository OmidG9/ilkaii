import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { brandSchema } from "@/lib/validation";
import { createBrand } from "@/services/admin";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const brand = await createBrand(await parseBody(request, brandSchema));
  await audit({ actorId: user.id, action: "brand.created", entity: "Brand", entityId: brand.id });
  return ok({ id: brand.id }, 201);
});
