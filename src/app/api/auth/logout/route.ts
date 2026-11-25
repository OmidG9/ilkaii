import { NextRequest } from "next/server";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { revokeSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  await revokeSession();
  return ok({ loggedOut: true });
});
