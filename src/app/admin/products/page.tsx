import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listAdminProducts, listBrands } from "@/services/admin";
import { ProductForm } from "@/components/admin/product-form";
import { ProductBulkTable } from "@/components/admin/product-bulk-table";
import { AdminPageHeader, AdminFilters, AdminPagination, AdminSearch } from "@/components/admin/admin-widgets";
import { formatNumber } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";
import type { ProductStatus } from "@prisma/client";

export const metadata: Metadata = { title: "محصولات" };
export const dynamic = "force-dynamic";

const statuses: ProductStatus[] = ["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"];
const statusLabels: Record<ProductStatus, string> = {
  DRAFT: "پیش‌نویس", ACTIVE: "فعال", INACTIVE: "غیرفعال", DISCONTINUED: "متوقف شده",
};

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("products.view");
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as ProductStatus) ? rawStatus as ProductStatus : undefined;
  const sort = params.sort === "price-asc" || params.sort === "price-desc" || params.sort === "stock-asc" || params.sort === "name" ? params.sort : "newest";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [result, categories, brands] = await Promise.all([
    listAdminProducts({ page, pageSize: 12, q: q || undefined, status, sort }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    listBrands(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="محصولات"
        description={`${formatNumber(result.total)} محصول ثبت شده. عملیات گروهی، قیمت و موجودی را می‌توانید از همین صفحه اعمال کنید.`}
      />
      <ProductForm categories={categories} brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))} />

      <section>
        <h2 className="mb-3 text-sm font-semibold">همه محصولات</h2>
        <AdminFilters resetHref="/admin/products">
          <AdminSearch defaultValue={q} placeholder="جستجو: نام، اسلاگ یا SKU" />
          <select name="status" defaultValue={status ?? ""} className="field max-w-44" aria-label="وضعیت">
            <option value="">همه وضعیت‌ها</option>
            {statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
          </select>
          <select name="sort" defaultValue={sort} className="field max-w-44" aria-label="مرتب‌سازی">
            <option value="newest">جدیدترین</option>
            <option value="price-asc">ارزان‌ترین</option>
            <option value="price-desc">گران‌ترین</option>
            <option value="stock-asc">کم‌ترین موجودی</option>
            <option value="name">نام</option>
          </select>
        </AdminFilters>
        <ProductBulkTable products={result.items} />
        <AdminPagination page={page} pageCount={result.pageCount} pathname="/admin/products" params={{ q: q || undefined, status: status || undefined, sort }} />
      </section>
    </div>
  );
}
