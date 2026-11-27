import { getCatalogFacets, listProducts } from "@/services/catalog";
import { getCategories } from "@/services/catalog";
import { ProductFilters } from "@/components/product-filters";
import { ProductGrid } from "@/components/product-grid";
import { Breadcrumbs, Pagination, SectionTitle } from "@/components/ui/display";
import { TrackEvent } from "@/components/track-event";
import { productQuerySchema } from "@/lib/validation";
import { normalizeSearchParams } from "@/lib/search-params";
import type { RawSearchParams } from "@/lib/search-params";
import { formatNumber } from "@/lib/persian";
import type { ReactNode } from "react";

export async function ProductListing({
  title,
  subtitle,
  pathname,
  searchParams,
  breadcrumb,
  fixedCategory,
  analyticsCategoryId,
  header,
}: {
  title: string;
  subtitle?: string;
  pathname: string;
  searchParams: RawSearchParams;
  breadcrumb?: { label: string; href?: string };
  fixedCategory?: string;
  analyticsCategoryId?: string;
  header?: ReactNode | ((total: number) => ReactNode);
}) {
  const raw = normalizeSearchParams(searchParams);
  if (fixedCategory) raw.category = fixedCategory;
  const parsed = productQuerySchema.safeParse(raw);
  const query = parsed.success
    ? parsed.data
    : productQuerySchema.parse({});
  const [categories, facets, result] = await Promise.all([getCategories(), getCatalogFacets(), listProducts(query)]);
  const headerContent = typeof header === "function" ? header(result.total) : header;

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
      {raw.q ? <TrackEvent name="search" properties={{ metadata: { query: raw.q.slice(0, 200), results: result.total } }} /> : null}
      {fixedCategory ? <TrackEvent name="category_view" properties={{ categoryId: analyticsCategoryId, metadata: { slug: fixedCategory } }} /> : null}
      {raw.size || raw.color || raw.minPrice || raw.maxPrice ? <TrackEvent name="filter_applied" properties={{ categoryId: analyticsCategoryId, metadata: { size: raw.size ?? null, color: raw.color ?? null, minPrice: raw.minPrice ?? null, maxPrice: raw.maxPrice ?? null } }} /> : null}
      {breadcrumb ? <Breadcrumbs items={[breadcrumb]} /> : null}
      {headerContent ?? <div className="mb-8"><SectionTitle title={title} subtitle={subtitle} /></div>}
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <ProductFilters categories={categories} initial={initial} lockedCategory={fixedCategory} sizes={facets.sizes} colors={facets.colors} />
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
