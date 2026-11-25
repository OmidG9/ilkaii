import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { listInventoryMovements } from "@/services/admin";
import { EntityManager, type EntityField } from "@/components/admin/entity-manager";
import { Card, Pagination, SectionTitle } from "@/components/ui/display";
import { formatJalali, formatNumber } from "@/lib/persian";
import { inventoryReasonLabels } from "@/lib/labels";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "موجودی — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const sku = typeof params.sku === "string" ? params.sku.slice(0, 64) : "";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [result, variants, lowStock] = await Promise.all([
    listInventoryMovements({ page, pageSize: 15, sku: sku || undefined }),
    prisma.productVariant.findMany({
      where: { product: { isDeleted: false } },
      orderBy: { sku: "asc" },
      take: 200,
      select: { id: true, sku: true, size: true, color: true, stock: true, product: { select: { name: true } } },
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 }, isAvailable: true, product: { isDeleted: false } },
      orderBy: { stock: "asc" },
      take: 12,
      select: { id: true, sku: true, stock: true, product: { select: { id: true, name: true } } },
    }),
  ]);

  const fields: EntityField[] = [
    { key: "variantId", label: "تنوع", type: "select", required: true, options: variants.map((variant) => ({
      value: variant.id,
      label: `${variant.product.name} — ${variant.sku}${variant.size ? ` / ${variant.size}` : ""}`,
    })) },
    { key: "quantity", label: "تغییر موجودی", type: "number", required: true, placeholder: "مثلاً ۱۰ یا -۳" },
    { key: "reason", label: "دلیل", type: "select", required: true, options: [
      { value: "RESTOCK", label: "شارژ موجودی" },
      { value: "ADJUSTMENT", label: "تنظیم دستی" },
      { value: "RETURN", label: "بازگشت کالا" },
    ] },
    { key: "note", label: "توضیح", type: "text" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-3xl font-semibold">مدیریت موجودی</h1>
        <p className="text-sm text-ink/60">هر تغییر موجودی همراه با دلیل و کاربر ثبت میشود. کاهش موجودی با عدد منفی انجام میشود.</p>
      </div>

      <section>
        <SectionTitle title="تنظیم موجودی" />
        <EntityManager endpoint="/api/admin/inventory" fields={fields} columns={[]} items={[]} canDelete={false} hideTable createLabel="ثبت تغییر" />
      </section>

      {lowStock.length ? (
        <section>
          <SectionTitle title="موجودی کم" subtitle="تنوعهایی که نیاز به شارژ دارند" />
          <Card className="overflow-hidden">
            <div className="table-wrap">
              <table className="table-luxury">
                <thead><tr><th>محصول</th><th>SKU</th><th>موجودی</th></tr></thead>
                <tbody>
                  {lowStock.map((variant) => (
                    <tr key={variant.id}>
                      <td><Link href={`/admin/products/${variant.product.id}`} className="text-primary hover:underline">{variant.product.name}</Link></td>
                      <td dir="ltr" className="text-xs">{variant.sku}</td>
                      <td className="font-semibold text-red-600">{formatNumber(variant.stock)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      ) : null}

      <section>
        <SectionTitle title="تاریخچه تغییرات" />
        <Card className="mb-5 p-5">
          <form method="get" className="flex flex-wrap gap-3">
            <input name="sku" defaultValue={sku} placeholder="جستجو بر اساس SKU" className="field max-w-sm flex-1" dir="ltr" />
            <button type="submit" className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-sm text-white">جستجو</button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <div className="table-wrap">
            <table className="table-luxury">
              <thead><tr><th>تاریخ</th><th>تنوع</th><th>تغییر</th><th>دلیل</th><th>توضیح</th></tr></thead>
              <tbody>
                {result.items.map((movement) => (
                  <tr key={movement.id}>
                    <td>{formatJalali(movement.createdAt)}</td>
                    <td>
                      <Link href={`/admin/products/${movement.variant.product.id}`} className="text-primary hover:underline">{movement.variant.product.name}</Link>
                      <p dir="ltr" className="mt-1 text-xs text-ink/45">{movement.variant.sku}</p>
                    </td>
                    <td dir="ltr" className={movement.quantity > 0 ? "text-emerald-700" : "text-red-600"}>
                      {movement.quantity > 0 ? "+" : ""}{formatNumber(movement.quantity)}
                    </td>
                    <td>{inventoryReasonLabels[movement.reason]}</td>
                    <td className="text-xs text-ink/60">{movement.note ?? "—"}</td>
                  </tr>
                ))}
                {!result.items.length ? <tr><td colSpan={5} className="py-10 text-center text-ink/50">تغییری یافت نشد.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>
        <Pagination page={page} pageCount={result.pageCount} pathname="/admin/inventory" params={{ sku: sku || undefined }} />
      </section>
    </div>
  );
}
