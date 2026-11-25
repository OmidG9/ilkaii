import { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { createMenuItem } from "@/services/cms";
import { menuItemSchema } from "@/lib/validation";

export const runtime = "nodejs";
const schema = menuItemSchema.extend({ menuId: z.string().min(1).max(64) });

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const input = await parseBody(request, schema);
  const item = await createMenuItem(input.menuId, input, user.id);
  return ok({ id: item.id }, 201);
});
