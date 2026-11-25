import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { couponSchema } from "@/lib/validation";
import { createCoupon } from "@/services/admin";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("coupon.write");
  const coupon = await createCoupon(await parseBody(request, couponSchema));
  await audit({ actorId: user.id, action: "coupon.created", entity: "Coupon", entityId: coupon.id });
  return ok({ id: coupon.id }, 201);
});
