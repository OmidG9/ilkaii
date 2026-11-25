import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { updateCustomerNotes } from "@/services/crm";
import { customerNotesSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("customers.update");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, customerNotesSchema);
  return ok(await updateCustomerNotes(id, input, user.id));
});
