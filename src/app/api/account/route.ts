import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { profileSchema } from "@/lib/validation";
import { getProfile, updateProfile } from "@/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await getProfile(user.id));
});

export const PATCH = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser();
  return ok(await updateProfile(user.id, await parseBody(request, profileSchema)));
});
