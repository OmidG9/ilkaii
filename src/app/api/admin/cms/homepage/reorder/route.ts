import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { reorderHomepageSections } from "@/services/cms";
import { reorderSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const input = await parseBody(request, reorderSchema);
  await reorderHomepageSections(input.ids, user.id);
  return ok({ reordered: true });
});
