import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteMediaAsset, updateMediaAsset } from "@/services/cms";
import { mediaUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, mediaUpdateSchema);
  await updateMediaAsset(id, { altText: input.altText, folder: input.folder }, user.id);
  return ok({ updated: true });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  await deleteMediaAsset(id, user.id);
  return ok({ deleted: true });
});
