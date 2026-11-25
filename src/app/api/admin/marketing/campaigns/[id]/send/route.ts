import { NextRequest } from "next/server";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { dispatchCampaign } from "@/services/marketing";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const POST = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("marketing.manage");
  const { id } = await (context as Context).params;
  return ok(await dispatchCampaign(id, user.id));
});
