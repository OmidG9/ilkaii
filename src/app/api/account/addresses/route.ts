import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { addressSchema } from "@/lib/validation";
import { createAddress, listAddresses } from "@/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await requireUser();
  return ok(await listAddresses(user.id));
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser();
  return ok(await createAddress(user.id, await parseBody(request, addressSchema)), 201);
});
