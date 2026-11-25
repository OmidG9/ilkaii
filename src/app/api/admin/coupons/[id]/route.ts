import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { couponSchema } from "@/lib/validation";
import { deleteCoupon, updateCoupon } from "@/services/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("coupon.write");
  const { id } = await (context as Context).params;
  const coupon = await updateCoupon(id, await parseBody(request, couponSchema));
  await audit({ actorId: user.id, action: "coupon.updated", entity: "Coupon", entityId: id });
  return ok({ id: coupon.id });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("coupon.write");
  const { id } = await (context as Context).params;
  await deleteCoupon(id);
  await audit({ actorId: user.id, action: "coupon.deleted", entity: "Coupon", entityId: id });
  return ok({ deleted: true });
});
