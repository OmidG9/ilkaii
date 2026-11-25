import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { createRole, listRoles } from "@/services/rbac";
import { roleCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async () => {
  await requirePermission("users.manage");
  return ok(await listRoles());
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("users.manage");
  const input = await parseBody(request, roleCreateSchema);
  const role = await createRole(input, user.id);
  return ok(role, 201);
});
