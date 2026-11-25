import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteRole, updateRole } from "@/services/rbac";
import { roleUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("users.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, roleUpdateSchema);
  return ok(await updateRole(id, input, user.id));
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("users.manage");
  const { id } = await (context as Context).params;
  await deleteRole(id, user.id);
  return ok({ deleted: true });
});
