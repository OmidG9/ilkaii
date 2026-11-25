import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteBanner, updateBanner } from "@/services/cms";
import { bannerUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, bannerUpdateSchema);
  await updateBanner(id, {
    ...input,
    ...(input.startsAt !== undefined ? { startsAt: input.startsAt ? new Date(input.startsAt) : null } : {}),
    ...(input.endsAt !== undefined ? { endsAt: input.endsAt ? new Date(input.endsAt) : null } : {}),
  }, user.id);
  return ok({ updated: true });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  await deleteBanner(id, user.id);
  return ok({ deleted: true });
});
