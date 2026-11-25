import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { listAdminProducts } from "@/services/admin";
import { listBrands } from "@/services/admin";
import { ProductForm } from "@/components/admin/product-form";
import { Card, Pagination, SectionTitle } from "@/components/ui/display";
import { formatToman } from "@/lib/money";
import { formatNumber } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";
import type { ProductStatus } from "@prisma/client";

export const metadata: Metadata = { title: "محصولات — مدیریت" };
export const dynamic = "force-dynamic";

const statuses: ProductStatus[] = ["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"];
const statusLabels: Record<ProductStatus, string> = {
  DRAFT: "پیشنویس", ACTIVE: "فعال", INACTIVE: "غیرفعال", DISCONTINUED: "متوقف شده",
};

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as ProductStatus) ? rawStatus as ProductStatus : undefined;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [result, categories, brands] = await Promise.all([
    listAdminProducts({ page, pageSize: 12, q: q || undefined, status }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    listBrands(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-semibold">محصولات</h1>
        <p className="text-sm text-ink/60">{formatNumber(result.total)} محصول ثبت شده. برای تنوعها و تصاویر، وارد صفحه محصول شوید.</p>
      </div>

      <ProductForm categories={categories} brands={brands.map((b) => ({ id: b.id, name: b.name }))} />

      <section>
        <SectionTitle title="همه محصولات" />
        <Card className="mb-5 p-5">
          <form method="get" className="flex flex-wrap gap-3">
            <input name="q" defaultValue={q} placeholder="جستجو: نام، اسلاگ یا SKU" className="field max-w-xs flex-1" dir="ltr" />
            <select name="status" className="field max-w-44" defaultValue={status ?? ""}>
              <option value="">همه وضعیتها</option>
              {statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
            </select>
            <button type="submit" className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-sm text-white">اعمال فیلتر</button>
          </form>
        </Card>
        <div className="table-wrap">
          <table className="table-luxury">
            <thead><tr><th>محصول</th><th>دستهبندی</th><th>قیمت</th><th>موجودی</th><th>تنوعها</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {result.items.map((product) => (
                <tr key={product.id}>
                  <td>
                    <Link href={`/admin/products/${product.id}`} className="font-medium text-primary hover:underline">{product.name}</Link>
                    <p dir="ltr" className="mt-1 text-xs text-ink/45">{product.sku}</p>
                  </td>
                  <td>{product.category}</td>
                  <td dir="ltr">{formatToman(product.salePrice ?? product.basePrice)}</td>
                  <td className={product.availableStock <= 5 ? "font-semibold text-red-600" : undefined}>{formatNumber(product.availableStock)}</td>
                  <td>{formatNumber(product.variants)}</td>
                  <td>{statusLabels[product.status]}</td>
                  <td><Link href={`/admin/products/${product.id}`} className="text-sm text-primary underline">مدیریت</Link></td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={7} className="py-10 text-center text-ink/50">محصولی یافت نشد.</td></tr> : null}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={result.pageCount} pathname="/admin/products" params={{ q: q || undefined, status: status || undefined }} />
      </section>
    </div>
  );
}
