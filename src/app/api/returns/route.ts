import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { returnSchema } from "@/lib/validation";
import { createReturn, listMyReturns } from "@/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listMyReturns(user.id));
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser();
  return ok(await createReturn(user.id, await parseBody(request, returnSchema)), 201);
});
