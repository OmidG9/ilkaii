import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { Card, Pagination } from "@/components/ui/display";
import { inventoryReasonLabels } from "@/lib/labels";
import { formatJalali, formatNumber } from "@/lib/persian";
import { listMovements } from "@/services/warehouse";
import type { InventoryReason } from "@prisma/client";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "تاریخچه موجودی — مدیریت انبار" };
export const dynamic = "force-dynamic";

const reasons = Object.keys(inventoryReasonLabels) as InventoryReason[];

function isReason(value: string | undefined): value is InventoryReason {
  return reasons.some((reason) => reason === value);
}

function referenceLink(movement: { order: { id: string; orderNumber: string } | null; referenceType: string | null; referenceId: string | null }) {
  if (movement.order) return <Link href={`/admin/orders/${movement.order.id}`} dir="ltr" className="text-primary hover:underline">{movement.order.orderNumber}</Link>;
  if (movement.referenceType === "PURCHASE_ORDER" && movement.referenceId) return <Link href={`/admin/inventory/purchase-orders/${movement.referenceId}`} className="text-primary hover:underline">سفارش خرید</Link>;
  if (movement.referenceType === "STOCKTAKE" && movement.referenceId) return <Link href={`/admin/inventory/stocktakes/${movement.referenceId}`} className="text-primary hover:underline">انبارگردانی</Link>;
  if (movement.referenceType === "RETURN_REQUEST" && movement.referenceId) return <Link href="/admin/returns" className="text-primary hover:underline">مرجوعی</Link>;
  if (movement.referenceType === "BULK_ADJUSTMENT") return <span className="text-[10px] text-ink/45">ویرایش گروهی</span>;
  if (movement.referenceType === "ADJUSTMENT") return <span className="text-[10px] text-ink/45">تنظیم دستی</span>;
  return <span className="text-ink/30">—</span>;
}

export default async function AdminInventoryMovementsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("inventory.manage");
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const reason = isReason(typeof params.reason === "string" ? params.reason : undefined) ? params.reason as InventoryReason : undefined;
  const referenceType = typeof params.ref === "string" ? params.ref.slice(0, 40) : "";
  const result = await listMovements({ page, pageSize: 25, q: q || undefined, reason, referenceType: referenceType || undefined });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تاریخچه گردش موجودی"
        description="دفتر تغییرات انبار؛ هر ردیف شامل دلتای اعمال‌شده، مانده پس از تغییر، دلیل و سند مرجع است."
      />
      <WarehouseTabs />

      <Card className="p-4">
        <form method="get" className="grid items-end gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <label className="space-y-1.5">
            <span className="block text-xs text-ink/55">جستجو</span>
            <input name="q" defaultValue={q} placeholder="نام کالا، SKU یا بارکد" className="field min-h-11 w-full" />
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs text-ink/55">دلیل</span>
            <select name="reason" defaultValue={reason ?? ""} className="field min-h-11 w-full cursor-pointer">
              <option value="">همه</option>
              {reasons.map((item) => <option key={item} value={item}>{inventoryReasonLabels[item]}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs text-ink/55">نوع سند</span>
            <select name="ref" defaultValue={referenceType} className="field min-h-11 w-full cursor-pointer">
              <option value="">همه</option>
              <option value="ORDER">سفارش</option>
              <option value="PURCHASE_ORDER">سفارش خرید</option>
              <option value="STOCKTAKE">انبارگردانی</option>
              <option value="RETURN_REQUEST">مرجوعی</option>
              <option value="BULK_ADJUSTMENT">ویرایش گروهی</option>
              <option value="ADJUSTMENT">تنظیم دستی</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-xl bg-primary px-5 text-sm text-white">اعمال</button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="table-wrap">
          <table className="table-luxury min-w-[1000px]">
            <thead><tr><th>تاریخ</th><th>کالا</th><th>SKU</th><th>تغییر</th><th>مانده</th><th>دلیل</th><th>مرجع</th><th>توضیح</th></tr></thead>
            <tbody>
              {result.items.map((movement) => (
                <tr key={movement.id}>
                  <td className="whitespace-nowrap text-xs">{formatJalali(movement.createdAt, true)}</td>
                  <td>
                    <Link href={`/admin/products/${movement.variant.product.id}`} className="text-xs font-medium text-primary hover:underline">{movement.variant.product.name}</Link>
                    <p className="mt-0.5 text-[10px] text-ink/40">{movement.variant.size}{movement.variant.color ? ` / ${movement.variant.color}` : ""}</p>
                  </td>
                  <td dir="ltr" className="text-[11px] text-ink/55">{movement.variant.sku}</td>
                  <td dir="ltr" className={`text-sm font-semibold ${movement.quantity > 0 ? "text-emerald-700" : "text-red-600"}`}>{movement.quantity > 0 ? "+" : ""}{formatNumber(movement.quantity)}</td>
                  <td dir="ltr" className="text-xs">{movement.balanceAfter === null ? "—" : formatNumber(movement.balanceAfter)}</td>
                  <td className="text-xs">{inventoryReasonLabels[movement.reason]}</td>
                  <td className="text-[11px]">{referenceLink(movement)}</td>
                  <td className="max-w-64 truncate text-[11px] text-ink/55" title={movement.note ?? undefined}>{movement.note ?? "—"}</td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={8} className="py-10 text-center text-ink/50">گردشی با این فیلترها یافت نشد.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination page={page} pageCount={result.pageCount} pathname="/admin/inventory/movements" params={{ q: q || undefined, reason, ref: referenceType || undefined }} />
      <p className="text-[10px] text-ink/35">{formatNumber(result.total)} حرکت ثبت‌شده — «مانده» موجودی همان تنوع بلافاصله پس از اعمال تغییر است. ردیف‌های قدیمی پیش از راه‌اندازی دفتر ممکن است مانده نداشته باشند.</p>
    </div>
  );
}
