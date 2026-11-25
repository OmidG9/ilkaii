import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { categorySchema } from "@/lib/validation";
import { createCategory } from "@/services/catalog";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const category = await createCategory(await parseBody(request, categorySchema));
  await audit({ actorId: user.id, action: "category.created", entity: "Category", entityId: category.id });
  return ok({ id: category.id }, 201);
});
