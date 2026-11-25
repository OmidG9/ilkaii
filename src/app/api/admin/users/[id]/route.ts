import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { assignUserRole, setUserActive } from "@/services/rbac";
import { adminUserUpdateSchema } from "@/lib/validation";
import { Errors } from "@/lib/errors";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const actor = await requirePermission("users.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, adminUserUpdateSchema);
  if (input.role) await assignUserRole(id, input.role, actor.id);
  if (input.isActive !== undefined) await setUserActive(id, input.isActive, actor.id);
  if (!input.role && input.isActive === undefined) throw Errors.badRequest("تغییری ارسال نشده است");
  return ok({ updated: true });
});
