import { ok, route } from "@/lib/http";
import { getProductBySlug } from "@/services/catalog";
import { listProductReviews } from "@/services/account";

export const runtime = "nodejs";

type Context = { params: Promise<{ slug: string }> };

export const GET = route(async (_request, context) => {
  const { slug } = await (context as Context).params;
  const product = await getProductBySlug(slug);
  return ok({ ...product, reviews: await listProductReviews(product.id) });
});
