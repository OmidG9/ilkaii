import { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { ensureMenu, listMenus } from "@/services/cms";

export const runtime = "nodejs";
const schema = z.object({ location: z.enum(["HEADER", "FOOTER", "MOBILE"]) });

export const GET = route(async () => {
  await requirePermission("cms.manage");
  return ok(await listMenus());
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const input = await parseBody(request, schema);
  return ok(await ensureMenu(input.location, user.id), 201);
});
