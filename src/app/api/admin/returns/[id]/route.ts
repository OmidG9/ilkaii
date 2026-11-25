import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { returnProcessSchema } from "@/lib/validation";
import { processReturn } from "@/services/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("order.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, returnProcessSchema);
  return ok(await processReturn(id, input.status, input.note, user.id));
});
