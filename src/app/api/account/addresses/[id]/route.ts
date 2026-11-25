import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { addressSchema } from "@/lib/validation";
import { deleteAddress, updateAddress } from "@/services/account";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireUser();
  const { id } = await (context as Context).params;
  const input = await parseBody(request, addressSchema.partial());
  return ok(await updateAddress(user.id, id, input));
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requireUser();
  const { id } = await (context as Context).params;
  return ok(await deleteAddress(user.id, id));
});
