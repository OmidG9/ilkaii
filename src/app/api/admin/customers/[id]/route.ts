import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { customerUpdateSchema } from "@/lib/validation";
import { updateCustomer } from "@/services/admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("customer.write");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, customerUpdateSchema);
  return ok(await updateCustomer(id, input, user.id));
});
