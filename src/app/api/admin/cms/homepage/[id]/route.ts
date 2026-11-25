import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteHomepageSection, updateHomepageSection } from "@/services/cms";
import { homepageSectionUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, homepageSectionUpdateSchema);
  await updateHomepageSection(id, {
    ...input,
    startsAt: input.startsAt === undefined ? undefined : input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null,
  }, user.id);
  return ok({ updated: true });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  await deleteHomepageSection(id, user.id);
  return ok({ deleted: true });
});
