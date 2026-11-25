import { NextRequest } from "next/server";
import { assertSameOrigin, ok, route } from "@/lib/http";
import { Errors } from "@/lib/errors";
import { requireAnyPermission } from "@/lib/auth/session";
import { processAndStoreImage } from "@/services/upload";
import { createMediaAsset } from "@/services/cms";

export const runtime = "nodejs";

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireAnyPermission("cms.manage", "product.write");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw Errors.badRequest("فایلی ارسال نشده است");
  const stored = await processAndStoreImage(file);
  const asset = await createMediaAsset({
    url: stored.url,
    mimeType: "image/webp",
    size: file.size,
    width: stored.width,
    height: stored.height,
    uploadedById: user.id,
  });
  return ok({ ...stored, mediaId: asset.id }, 201);
});
