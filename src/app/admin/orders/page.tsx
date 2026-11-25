import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import Link from "next/link";
import { listAdminOrders } from "@/services/admin";
import { Card, Pagination } from "@/components/ui/display";
import { formatToman } from "@/lib/money";
import { formatJalali, formatNumber } from "@/lib/persian";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/labels";
import type { OrderStatus } from "@prisma/client";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "سفارشها — مدیریت" };
export const dynamic = "force-dynamic";

const statuses: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("orders.view");
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const rawStatus = typeof params.status === "string" ? params.status : "";
  const status = statuses.includes(rawStatus as OrderStatus) ? rawStatus as OrderStatus : undefined;
  const sort = params.sort === "oldest" || params.sort === "total-desc" || params.sort === "total-asc" ? params.sort : "newest";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const result = await listAdminOrders({ page, pageSize: 15, q: q || undefined, status, sort });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-semibold">سفارشها</h1>
        <p className="text-sm text-ink/60">{formatNumber(result.total)} سفارش ثبت شده.</p>
      </div>

      <Card className="p-5">
        <form method="get" className="flex flex-wrap gap-3">
          <input name="q" defaultValue={q} placeholder="شماره سفارش یا موبایل" className="field max-w-xs flex-1" dir="ltr" />
          <select name="status" className="field max-w-48" defaultValue={status ?? ""}>
            <option value="">همه وضعیتها</option>
            {statuses.map((item) => <option key={item} value={item}>{orderStatusLabels[item]}</option>)}
          </select>
          <select name="sort" className="field max-w-44" defaultValue={sort} aria-label="مرتب‌سازی">
            <option value="newest">جدیدترین</option>
            <option value="oldest">قدیمی‌ترین</option>
            <option value="total-desc">بیشترین مبلغ</option>
            <option value="total-asc">کمترین مبلغ</option>
          </select>
          <button type="submit" className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-sm text-white">اعمال فیلتر</button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="table-wrap">
          <table className="table-luxury">
            <thead><tr><th>سفارش</th><th>مشتری</th><th>تاریخ</th><th>مبلغ</th><th>وضعیت</th><th>پرداخت</th><th></th></tr></thead>
            <tbody>
              {result.items.map((order) => (
                <tr key={order.id}>
                  <td dir="ltr" className="text-xs font-medium">{order.orderNumber}</td>
                  <td>
                    <p dir="ltr" className="text-xs">{order.user?.phone ?? "—"}</p>
                    <p className="mt-1 text-xs text-ink/50">{[order.user?.firstName, order.user?.lastName].filter(Boolean).join(" ") || "—"}</p>
                  </td>
                  <td>{formatJalali(order.createdAt)}</td>
                  <td dir="ltr">{formatToman(order.total)}</td>
                  <td>{orderStatusLabels[order.status]}</td>
                  <td>{paymentStatusLabels[order.paymentStatus]}</td>
                  <td><Link href={`/admin/orders/${order.id}`} className="text-sm text-primary underline">جزئیات</Link></td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={7} className="py-10 text-center text-ink/50">سفارشی یافت نشد.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination page={page} pageCount={result.pageCount} pathname="/admin/orders" params={{ q: q || undefined, status: status || undefined, sort }} />
    </div>
  );
}
