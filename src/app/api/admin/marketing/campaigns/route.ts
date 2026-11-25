import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { createCampaign } from "@/services/marketing";
import { campaignSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("marketing.manage");
  const input = await parseBody(request, campaignSchema);
  const campaign = await createCampaign({
    ...input,
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
  }, user.id);
  return ok({ id: campaign.id }, 201);
});
