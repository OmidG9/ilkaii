import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { createBanner, listBanners } from "@/services/cms";
import { bannerSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async () => {
  await requirePermission("cms.manage");
  return ok(await listBanners());
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const input = await parseBody(request, bannerSchema);
  const banner = await createBanner({
    ...input,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
  }, user.id);
  return ok({ id: banner.id }, 201);
});
