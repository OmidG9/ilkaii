import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { PurchaseOrderActions } from "@/components/admin/purchase-order-actions";
import { PrintButton } from "@/components/admin/print-button";
import { Card, SectionTitle } from "@/components/ui/display";
import { purchaseOrderStatusLabels } from "@/lib/labels";
import { formatToman } from "@/lib/money";
import { formatJalali, formatNumber } from "@/lib/persian";
import { getPurchaseOrder } from "@/services/warehouse";

export const metadata: Metadata = { title: "جزئیات سفارش خرید — مدیریت انبار" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function statusTone(status: string) {
  if (status === "RECEIVED") return "bg-emerald-100 text-emerald-800";
  if (status === "PARTIAL") return "bg-sky-100 text-sky-800";
  if (status === "ORDERED") return "bg-amber-100 text-amber-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-line text-ink/70";
}

export default async function AdminPurchaseOrderDetailPage({ params }: Props) {
  await requirePagePermission("inventory.manage");
  const { id } = await params;
  let order;
  try {
    order = await getPurchaseOrder(id);
  } catch {
    notFound();
  }
  const totalReceived = order.items.reduce((sum, item) => sum + item.receivedQuantity, 0);
  const totalOrdered = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 dir="ltr" className="text-2xl font-semibold">{order.number}</h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${statusTone(order.status)}`}>{purchaseOrderStatusLabels[order.status]}</span>
          </div>
          <p className="mt-2 text-sm text-ink/55">تأمین‌کننده: <Link href="/admin/inventory/suppliers" className="text-primary hover:underline">{order.supplier.name}</Link></p>
          <p className="mt-1 text-[11px] text-ink/40">
            ثبت: {formatJalali(order.createdAt, true)}
            {order.expectedAt ? ` — تحویل مورد انتظار: ${formatJalali(order.expectedAt)}` : ""}
            {order.receivedAt ? ` — تکمیل دریافت: ${formatJalali(order.receivedAt, true)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {order.status === "DRAFT" ? (
            <Link href={`/admin/inventory/purchase-orders/${order.id}/edit`} className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-xs text-white hover:bg-hover">ویرایش پیش‌نویس</Link>
          ) : null}
          <Link href="/admin/inventory/purchase-orders" className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-xs hover:border-primary">بازگشت به فهرست</Link>
          <PrintButton />
        </div>
      </div>
      <WarehouseTabs />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] text-ink/45">جمع اقلام</p><p dir="ltr" className="mt-2 text-lg font-semibold">{formatToman(order.subtotal)}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-ink/45">تخفیف تأمین‌کننده</p><p dir="ltr" className="mt-2 text-lg font-semibold">{formatToman(order.discountAmount)}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-ink/45">هزینه حمل</p><p dir="ltr" className="mt-2 text-lg font-semibold">{formatToman(order.shippingCost)}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-ink/45">مبلغ نهایی</p><p dir="ltr" className="mt-2 text-lg font-semibold text-primary">{formatToman(order.totalAmount)}</p></Card>
      </div>

      <section>
        <SectionTitle title="اقلام سفارش" subtitle={`${formatNumber(totalOrdered)} عدد سفارش داده شده — ${formatNumber(totalReceived)} عدد دریافت شده`} />
        <Card className="overflow-hidden">
          <div className="table-wrap">
            <table className="table-luxury min-w-[860px]">
              <thead><tr><th>کالا</th><th>SKU</th><th>تعداد</th><th>دریافت‌شده</th><th>باقی‌مانده</th><th>بهای واحد</th><th>جمع</th></tr></thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/admin/products/${item.variant.product.id}`} className="text-xs font-medium text-primary hover:underline">{item.variant.product.name}</Link>
                      <p className="mt-0.5 text-[10px] text-ink/45">{item.variant.size}{item.variant.color ? ` / ${item.variant.color}` : ""}</p>
                      {item.note ? <p className="mt-1 text-[10px] text-ink/40">{item.note}</p> : null}
                    </td>
                    <td dir="ltr" className="text-[11px]">{item.variant.sku}</td>
                    <td>{formatNumber(item.quantity)}</td>
                    <td>{formatNumber(item.receivedQuantity)}</td>
                    <td className={item.remaining > 0 ? "font-semibold text-amber-700" : "text-emerald-700"}>{formatNumber(item.remaining)}</td>
                    <td dir="ltr" className="text-[11px]">{formatToman(item.unitCost, false)}</td>
                    <td dir="ltr" className="text-[11px]">{formatToman(item.lineTotal, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        {order.note ? <p className="mt-3 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-ink/60">{order.note}</p> : null}
      </section>

      <PurchaseOrderActions
        orderId={order.id}
        status={order.status}
        hasReceived={totalReceived > 0}
        lines={order.items.map((item) => ({
          id: item.id,
          label: `${item.variant.product.name} — ${item.variant.size}${item.variant.color ? ` / ${item.variant.color}` : ""}`,
          sku: item.variant.sku,
          quantity: item.quantity,
          receivedQuantity: item.receivedQuantity,
          remaining: item.remaining,
          unitCost: item.unitCost,
        }))}
      />

      <p className="text-[10px] leading-5 text-ink/35">
        رسید انبار به‌صورت تراکنشی موجودی هر تنوع را افزایش می‌دهد، یک حرکت «خرید/ورود کالا» با بهای واحد ثبت می‌کند و بهای خرید تنوع را به‌صورت میانگین موزون به‌روز می‌کند. دریافت بخشی از اقلام مجاز است و وضعیت سفارش به «ورود بخشی» تغییر می‌کند.
      </p>
    </div>
  );
}
