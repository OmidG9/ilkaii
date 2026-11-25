import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { createCmsPage, listCmsPages } from "@/services/cms";
import { cmsPageSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async () => {
  await requirePermission("cms.manage");
  return ok(await listCmsPages());
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const input = await parseBody(request, cmsPageSchema);
  const page = await createCmsPage({
    ...input,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
  }, user.id);
  return ok({ id: page.id }, 201);
});
