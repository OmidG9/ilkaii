import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { z } from "zod";
import { listWishlist, toggleWishlist } from "@/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listWishlist(user.id));
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser();
  const input = await parseBody(request, z.object({ productId: z.string().min(8).max(64) }));
  return ok(await toggleWishlist(user.id, input.productId));
});
