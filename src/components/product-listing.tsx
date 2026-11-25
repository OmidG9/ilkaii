import { listProducts } from "@/services/catalog";
import { getCategories } from "@/services/catalog";
import { ProductFilters } from "@/components/product-filters";
import { ProductGrid } from "@/components/product-grid";
import { Breadcrumbs, Pagination, SectionTitle } from "@/components/ui/display";
import { productQuerySchema } from "@/lib/validation";
import { normalizeSearchParams } from "@/lib/search-params";
import type { RawSearchParams } from "@/lib/search-params";
import { formatNumber } from "@/lib/persian";

export async function ProductListing({
  title,
  subtitle,
  pathname,
  searchParams,
  breadcrumb,
  fixedCategory,
}: {
  title: string;
  subtitle?: string;
  pathname: string;
  searchParams: RawSearchParams;
  breadcrumb?: { label: string; href?: string };
  fixedCategory?: string;
}) {
  const raw = normalizeSearchParams(searchParams);
  if (fixedCategory) raw.category = fixedCategory;
  const parsed = productQuerySchema.safeParse(raw);
  const query = parsed.success
    ? parsed.data
    : productQuerySchema.parse({});
  const [categories, result] = await Promise.all([getCategories(), listProducts(query)]);

  const initial = {
    q: raw.q,
    category: fixedCategory ? undefined : raw.category,
    size: raw.size,
    color: raw.color,
    minPrice: raw.minPrice,
    maxPrice: raw.maxPrice,
    sort: raw.sort,
    available: raw.available,
  };

  return (
    <div className="container-luxury py-10">
      {breadcrumb ? <Breadcrumbs items={[breadcrumb]} /> : null}
      <SectionTitle title={title} subtitle={subtitle} />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <ProductFilters categories={categories} initial={initial} />
        <div>
          <p className="mb-6 text-xs text-ink/55">
            {formatNumber(result.total)} محصول یافت شد
          </p>
          <ProductGrid products={result.items} />
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            pathname={pathname}
            params={raw}
          />
        </div>
      </div>
    </div>
  );
}
