import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteCmsPage, updateCmsPage } from "@/services/cms";
import { cmsPageUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, cmsPageUpdateSchema);
  const page = await updateCmsPage(id, {
    ...input,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
  }, user.id);
  return ok({ id: page.id });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  await deleteCmsPage(id, user.id);
  return ok({ deleted: true });
});
