import { ok, route } from "@/lib/http";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await getSessionUser();
  return ok({ user });
});
