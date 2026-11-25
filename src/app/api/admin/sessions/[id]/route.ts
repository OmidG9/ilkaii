import { NextRequest } from "next/server";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { revokeAdminSession } from "@/services/rbac";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("users.manage");
  const { id } = await (context as Context).params;
  await revokeAdminSession(id, user.id);
  return ok({ revoked: true });
});
