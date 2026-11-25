import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteSubscriber, updateSubscriber } from "@/services/marketing";
import { subscriberUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("marketing.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, subscriberUpdateSchema);
  return ok(await updateSubscriber(id, input, user.id));
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("marketing.manage");
  const { id } = await (context as Context).params;
  await deleteSubscriber(id, user.id);
  return ok({ deleted: true });
});
