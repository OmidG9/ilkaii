import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { requirePageUser } from "@/lib/auth/session";
import { listReturnableOrders } from "@/services/account";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, SectionTitle } from "@/components/ui/display";
import { formatJalali, formatNumber } from "@/lib/persian";
import { orderStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "ثبت درخواست مرجوعی", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewReturnPage() {
  const user = await requirePageUser();
  const orders = await listReturnableOrders(user.id);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          title="ثبت درخواست مرجوعی"
          subtitle="سفارش مورد نظر را انتخاب کنید و سپس اقلام و تعداد قابل بازگشت را مشخص کنید."
        />
        <Link href="/account/returns" className="mb-8 inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          درخواست‌های قبلی
        </Link>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03] p-5 text-xs leading-6 text-ink/65">
        <p className="flex items-center gap-2 font-semibold text-ink">
          <RotateCcw className="h-4 w-4 text-primary" />
          شرایط ثبت مرجوعی
        </p>
        <p className="mt-2">
          درخواست بازگشت پس از «ارسال» یا «تحویل» سفارش و تا ۷ روز پس از تحویل فعال می‌شود. کالا باید استفاده نشده و
          دارای برچسب اصلی باشد.
        </p>
        <p className="mt-1">
          جزئیات کامل در <Link href="/policies/returns" className="text-primary underline">سیاست بازگشت کالا</Link> آمده است.
        </p>
      </Card>

      {orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <div>
                  <p dir="ltr" className="text-sm font-semibold text-primary">{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-ink/50">{formatJalali(order.createdAt)}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  {orderStatusLabels[order.status]}
                </span>
              </div>

              <ul className="mt-4 space-y-2 text-sm">
                {order.lines.map((line) => (
                  <li key={line.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-2">
                    <span>
                      <span className="font-medium">{line.productName}</span>
                      {line.variantName ? <span className="mr-2 text-xs text-ink/50">{line.variantName}</span> : null}
                    </span>
                    <span className="text-xs text-ink/55">
                      قابل بازگشت: <span className="font-semibold text-primary">{formatNumber(line.returnable)}</span>
                      {" "}از {formatNumber(line.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex justify-end">
                <ButtonLink href={`/account/orders/${encodeURIComponent(order.orderNumber)}#return-request`}>
                  انتخاب اقلام و ثبت درخواست
                </ButtonLink>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="سفارش قابل مرجوعی ندارید"
          description="درخواست بازگشت پس از ارسال یا تحویل سفارش فعال می‌شود. اگر سفارش شما هنوز در حال آماده‌سازی است، می‌توانید وضعیت آن را از صفحه سفارش‌ها ببینید."
          action={
            <ButtonLink href="/account/orders" className="mt-2">مشاهده سفارش‌های من</ButtonLink>
          }
        />
      )}
    </section>
  );
}
