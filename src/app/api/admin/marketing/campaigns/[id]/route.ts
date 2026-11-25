import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteCampaign, updateCampaign } from "@/services/marketing";
import { campaignUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("marketing.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, campaignUpdateSchema);
  await updateCampaign(id, {
    ...input,
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
  }, user.id);
  return ok({ updated: true });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("marketing.manage");
  const { id } = await (context as Context).params;
  await deleteCampaign(id, user.id);
  return ok({ deleted: true });
});
