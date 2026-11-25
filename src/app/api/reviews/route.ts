import { NextRequest } from "next/server";
import { assertSameOrigin, ok, parseBody, parseQuery, route } from "@/lib/http";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { reviewSchema } from "@/lib/validation";
import { createReview, listProductReviews } from "@/services/account";

export const runtime = "nodejs";

export const GET = route(async (request: NextRequest) => {
  const query = parseQuery(request, z.object({ productId: z.string().min(8).max(64) }));
  return ok(await listProductReviews(query.productId));
});

export const POST = route(async (request: NextRequest) => {
  assertSameOrigin(request);
  const user = await requireUser();
  return ok(await createReview(user.id, await parseBody(request, reviewSchema)), 201);
});
