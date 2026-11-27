import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { Card, Pagination } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { purchaseOrderStatusLabels } from "@/lib/labels";
import { formatToman } from "@/lib/money";
import { formatJalali, formatNumber } from "@/lib/persian";
import { listPurchaseOrders } from "@/services/warehouse";
import type { PurchaseOrderStatus } from "@prisma/client";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "سفارش‌های خرید — مدیریت انبار" };
export const dynamic = "force-dynamic";

const statuses: PurchaseOrderStatus[] = ["DRAFT", "ORDERED", "PARTIAL", "RECEIVED", "CANCELLED"];

function parseStatus(value: string | undefined): PurchaseOrderStatus | undefined {
  return statuses.find((status) => status === value);
}

function statusTone(status: PurchaseOrderStatus) {
  if (status === "RECEIVED") return "bg-emerald-100 text-emerald-800";
  if (status === "PARTIAL") return "bg-sky-100 text-sky-800";
  if (status === "ORDERED") return "bg-amber-100 text-amber-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-line text-ink/70";
}

export default async function AdminPurchaseOrdersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("inventory.manage");
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const status = parseStatus(typeof params.status === "string" ? params.status : undefined);
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const result = await listPurchaseOrders({ page, pageSize: 15, status, q: q || undefined });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="سفارش‌های خرید"
        description="چرخه خرید از پیش‌نویس تا رسید انبار؛ رسید کالا موجودی و بهای میانگین خرید را به‌روز می‌کند."
        actions={<ButtonLink href="/admin/inventory/purchase-orders/new" size="sm">سفارش خرید جدید</ButtonLink>}
      />
      <WarehouseTabs />

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-52 flex-1 space-y-1.5">
            <span className="block text-xs text-ink/55">جستجو</span>
            <input name="q" defaultValue={q} placeholder="شماره سفارش، تأمین‌کننده، SKU یا نام کالا" className="field min-h-11 w-full" />
          </label>
          <label className="space-y-1.5">
            <span className="block text-xs text-ink/55">وضعیت</span>
            <select name="status" defaultValue={status ?? ""} className="field min-h-11 min-w-44 cursor-pointer">
              <option value="">همه</option>
              {statuses.map((item) => <option key={item} value={item}>{purchaseOrderStatusLabels[item]}</option>)}
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-xl bg-primary px-5 text-sm text-white">اعمال</button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="table-wrap">
          <table className="table-luxury min-w-[900px]">
            <thead><tr><th>شماره</th><th>تأمین‌کننده</th><th>وضعیت</th><th>اقلام</th><th>دریافت</th><th>مبلغ</th><th>تحویل مورد انتظار</th><th>تاریخ ثبت</th></tr></thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/admin/inventory/purchase-orders/${order.id}`} dir="ltr" className="text-xs font-medium text-primary hover:underline">{order.number}</Link></td>
                  <td className="text-xs">{order.supplier.name}</td>
                  <td><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${statusTone(order.status)}`}>{purchaseOrderStatusLabels[order.status]}</span></td>
                  <td className="text-xs">{formatNumber(order.lines)} قلم / {formatNumber(order.units)} عدد</td>
                  <td className="text-xs">{formatNumber(order.receivedUnits)} عدد</td>
                  <td dir="ltr" className="text-[11px]">{formatToman(order.total)}</td>
                  <td className="text-xs">{order.expectedAt ? formatJalali(order.expectedAt) : "—"}</td>
                  <td className="text-xs">{formatJalali(order.createdAt)}</td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={8} className="py-10 text-center text-ink/50">سفارش خریدی یافت نشد.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination page={page} pageCount={result.pageCount} pathname="/admin/inventory/purchase-orders" params={{ q: q || undefined, status }} />
      <p className="text-[10px] text-ink/35">{formatNumber(result.total)} سفارش خرید — مبالغ بر اساس بهای خرید ثبت‌شده در هر قلم است.</p>
    </div>
  );
}
