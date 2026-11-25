import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { reviewModerationSchema } from "@/lib/validation";
import { deleteReview, moderateReview } from "@/services/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  return ok(await moderateReview(id, (await parseBody(request, reviewModerationSchema)).isApproved, user.id));
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("product.write");
  const { id } = await (context as Context).params;
  await deleteReview(id, user.id);
  return ok({ deleted: true });
});
