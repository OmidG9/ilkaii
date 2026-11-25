import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, route } from "@/lib/http";
import { requirePermission } from "@/lib/auth/session";
import { createBlogPost, listBlogPosts } from "@/services/cms";
import { blogPostSchema } from "@/lib/validation";

export const runtime = "nodejs";

export const GET = route(async () => {
  await requirePermission("cms.manage");
  return ok(await listBlogPosts());
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requirePermission("cms.manage");
  const input = await parseBody(request, blogPostSchema);
  const post = await createBlogPost({
    ...input,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
  }, user.id);
  return ok({ id: post.id }, 201);
});
