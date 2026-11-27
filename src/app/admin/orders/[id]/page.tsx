import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import { getAdminOrder, ORDER_TRANSITIONS } from "@/services/admin";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { Card, SectionTitle } from "@/components/ui/display";
import { formatToman } from "@/lib/money";
import { formatJalali, formatNumber } from "@/lib/persian";
import { orderStatusLabels, paymentGatewayLabels, paymentStatusLabels, shippingMethodLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "جزئیات سفارش — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("orders.view");
  const { id } = await params;
  let order;
  try {
    order = await getAdminOrder(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">سفارش <span dir="ltr" className="text-primary">{order.orderNumber}</span></h1>
          <p className="mt-2 text-xs text-ink/55">{formatJalali(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-4 py-2 text-xs text-primary">{orderStatusLabels[order.status]}</span>
          <span className="rounded-full bg-line px-4 py-2 text-xs text-ink/65">{paymentStatusLabels[order.paymentStatus]}</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">کالاها</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-line/70 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">{item.productName}</p>
                    {item.variantName ? <p className="text-xs text-ink/55">{item.variantName}</p> : null}
                    <p dir="ltr" className="mt-1 text-xs text-ink/45">{item.sku}</p>
                  </div>
                  <div className="text-left text-xs">
                    <p>{formatNumber(item.quantity)} × {formatToman(item.unitPrice)}</p>
                    <p className="mt-1 font-semibold">{formatToman(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>
            <dl className="mr-auto mt-6 max-w-xs space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink/60">جمع کالاها</dt><dd dir="ltr">{formatToman(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/60">تخفیف</dt><dd dir="ltr">{formatToman(order.discount)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/60">ارسال</dt><dd dir="ltr">{formatToman(order.shipping)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>مبلغ نهایی</dt><dd dir="ltr" className="text-primary">{formatToman(order.total)}</dd></div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">اطلاعات تحویل</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p>{order.recipientName} — <span dir="ltr">{order.recipientPhone}</span></p>
              <p className="text-xs text-ink/60">روش ارسال: {shippingMethodLabels[order.shippingMethod]}</p>
              <p className="sm:col-span-2">{order.province}، {order.city}، {order.street}</p>
              <p dir="ltr" className="text-xs text-ink/55">{order.postalCode}</p>
              {order.trackingNumber ? <p dir="ltr" className="text-xs text-primary">کد پیگیری: {order.trackingNumber}</p> : null}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">تاریخچه وضعیت</h2>
            <ol className="space-y-3 border-r-2 border-line pr-5">
              {order.statusHistory.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -right-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
                  <p className="text-sm">{orderStatusLabels[entry.toStatus]}</p>
                  <p className="text-xs text-ink/50">{formatJalali(entry.createdAt)} {entry.note ? `— ${entry.note}` : ""}</p>
                </li>
              ))}
              {!order.statusHistory.length ? <li className="text-sm text-ink/55">تاریخچهای ثبت نشده است.</li> : null}
            </ol>
          </Card>

          {order.payments.length ? (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold">پرداختها</h2>
              {order.paymentGateway ? (
                <p className="mb-3 text-xs text-ink/50">درگاه انتخابی: <span className="font-medium text-ink/75">{paymentGatewayLabels[order.paymentGateway] ?? order.paymentGateway}</span></p>
              ) : null}
              <div className="table-wrap">
                <table className="table-luxury">
                  <thead><tr><th>درگاه</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr></thead>
                  <tbody>
                    {order.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td dir="ltr">{paymentGatewayLabels[payment.provider] ?? payment.provider}</td>
                        <td dir="ltr">{formatToman(payment.amount)}</td>
                        <td>{paymentStatusLabels[payment.status]}</td>
                        <td>{formatJalali(payment.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <OrderStatusForm orderId={order.id} currentStatus={order.status} transitions={ORDER_TRANSITIONS[order.status] ?? []} labels={orderStatusLabels} />
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">مشتری</h2>
            <p className="text-sm">{order.user ? [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") || "—" : "—"}</p>
            <p dir="ltr" className="mt-1 text-xs text-ink/55">{order.user?.phone ?? "—"}</p>
            {order.user?.email ? <p dir="ltr" className="mt-1 text-xs text-ink/55">{order.user.email}</p> : null}
            {order.returnRequests.length ? (
              <p className="mt-4 text-xs text-ink/60">درخواست بازگشت: {formatNumber(order.returnRequests.length)}</p>
            ) : null}
          </Card>
        </div>
      </div>

      <SectionTitle title="ارجاع" linkLabel="بازگشت به سفارشها" href="/admin/orders" />
    </div>
  );
}
