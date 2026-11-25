import { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { reorderMenuItems } from "@/services/cms";

export const runtime = "nodejs";
const schema = z.object({ menuId: z.string().min(1).max(64), ids: z.array(z.string().min(1).max(64)).min(1).max(200) });

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const input = await parseBody(request, schema);
  await reorderMenuItems(input.menuId, input.ids, user.id);
  return ok({ reordered: true });
});
