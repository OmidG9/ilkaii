import { NextRequest } from "next/server";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { Errors } from "@/lib/errors";
import { requirePermission } from "@/lib/auth/session";
import { processAndStoreImage } from "@/services/upload";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  await requirePermission("product.write");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw Errors.badRequest("فایلی ارسال نشده است");
  return ok(await processAndStoreImage(file), 201);
});
