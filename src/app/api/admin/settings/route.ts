import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { settingsSchema } from "@/lib/validation";
import { updateSettings } from "@/services/admin";

export const runtime = "nodejs";

export const PATCH = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("setting.write");
  return ok(await updateSettings(await parseBody(request, settingsSchema), user.id));
});
