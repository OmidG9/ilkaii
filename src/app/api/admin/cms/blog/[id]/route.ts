import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { deleteBlogPost, updateBlogPost } from "@/services/cms";
import { blogPostUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const PATCH = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  const input = await parseBody(request, blogPostUpdateSchema);
  await updateBlogPost(id, {
    ...input,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
  }, user.id);
  return ok({ updated: true });
});

export const DELETE = route(async (request: NextRequest, context) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const { id } = await (context as Context).params;
  await deleteBlogPost(id, user.id);
  return ok({ deleted: true });
});
