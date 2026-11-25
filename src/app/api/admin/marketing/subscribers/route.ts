import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { createSubscriber } from "@/services/marketing";
import { subscriberSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("marketing.manage");
  const input = await parseBody(request, subscriberSchema);
  const subscriber = await createSubscriber(input, user.id);
  return ok({ id: subscriber.id }, 201);
});
