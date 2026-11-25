import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { createHomepageSection, listHomepageSections } from "@/services/cms";
import { homepageSectionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async () => {
  await requirePermission("cms.manage");
  return ok(await listHomepageSections());
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const input = await parseBody(request, homepageSectionSchema);
  const section = await createHomepageSection({
    ...input,
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
  }, user.id);
  return ok({ id: section.id }, 201);
});
