import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { requirePageUser } from "@/lib/auth/session";
import { getUserOrder } from "@/services/account";
import { Card, SectionTitle } from "@/components/ui/display";
import { ReturnForm } from "@/components/return-form";
import { formatJalali, formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "جزئیات سفارش", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const user = await requirePageUser();
  const { orderNumber } = await params;
  let order;
  try {
    order = await getUserOrder(user.id, decodeURIComponent(orderNumber));
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">سفارش <span dir="ltr" className="text-primary">{order.orderNumber}</span></h1>
          <p className="mt-2 text-xs text-ink/55">ثبت شده در {formatJalali(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full bg-primary/10 px-4 py-2 text-xs text-primary">{orderStatusLabels[order.status]}</span>
          <span className="rounded-full bg-line px-4 py-2 text-xs text-ink/65">{paymentStatusLabels[order.paymentStatus]}</span>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">کالاها</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-line/70 pb-4 last:border-0 last:pb-0">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-line/20">
                {item.imageUrl ? <Image src={item.imageUrl} alt={item.productName} fill sizes="64px" className="object-cover" /> : null}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.productName}</p>
                {item.variantName ? <p className="text-xs text-ink/55">{item.variantName}</p> : null}
                <p dir="ltr" className="mt-1 text-xs text-ink/45">{item.sku}</p>
              </div>
              <div className="text-left text-sm">
                <p>{formatNumber(item.quantity)} × {formatToman(item.unitPrice)}</p>
                <p className="mt-1 font-semibold text-primary">{formatToman(item.lineTotal)}</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">آدرس تحویل</h2>
          <p className="text-sm leading-7 text-ink/70">{order.recipientName}</p>
          <p dir="ltr" className="text-sm text-ink/60">{order.recipientPhone}</p>
          <p className="mt-2 text-sm leading-7 text-ink/70">{order.province}، {order.city}، {order.street}</p>
          <p dir="ltr" className="text-sm text-ink/60">{order.postalCode}</p>
          {order.trackingNumber ? <p dir="ltr" className="mt-4 text-xs text-primary">کد پیگیری: {order.trackingNumber}</p> : null}
          {order.estimatedDelivery ? <p className="mt-2 text-xs text-ink/55">تحویل تخمینی: {formatJalali(order.estimatedDelivery)}</p> : null}
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">تاریخچه وضعیت</h2>
          <ol className="space-y-4 border-r-2 border-line pr-5">
            {order.statusHistory.map((item) => (
              <li key={item.id} className="relative">
                <span className="absolute -right-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
                <p className="text-sm font-medium">{orderStatusLabels[item.toStatus]}</p>
                <p className="text-xs text-ink/50">{formatJalali(item.createdAt)} {item.note ? `— ${item.note}` : ""}</p>
              </li>
            ))}
          </ol>
          {order.payments.length ? (
            <p className="mt-5 border-t border-line pt-4 text-xs text-ink/55">
              پرداخت: {order.payments.map((payment) => payment.provider).join(", ")}
            </p>
          ) : null}
        </Card>
      </div>

      {["SHIPPED", "DELIVERED"].includes(order.status) ? (
        <section>
          <SectionTitle title="درخواست بازگشت" />
          <ReturnForm orderId={order.id} />
        </section>
      ) : null}
    </div>
  );
}
