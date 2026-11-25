import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteSecret, isSecretKey, listSecretMetadata, setSecret } from "@/lib/secrets";
import { secretUpdateSchema } from "@/lib/validation";
import { Errors } from "@/lib/errors";

export const runtime = "nodejs";

export const GET = route(async () => {
  await requirePermission("settings.manage");
  return ok(await listSecretMetadata());
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("settings.manage");
  const input = await parseBody(request, secretUpdateSchema);
  if (!isSecretKey(input.key)) throw Errors.badRequest("کلید راز نامعتبر است");
  if (input.action === "delete") {
    await deleteSecret(input.key, user.id);
    return ok({ deleted: true });
  }
  if (!input.value) throw Errors.badRequest("مقدار راز الزامی است");
  await setSecret(input.key, input.value, user.id);
  return ok({ saved: true });
});
