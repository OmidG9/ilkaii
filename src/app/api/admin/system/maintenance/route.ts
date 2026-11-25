import { NextRequest } from "next/server";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { runMaintenanceJob } from "@/services/system";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("settings.manage");
  return ok(await runMaintenanceJob(user.id));
});
