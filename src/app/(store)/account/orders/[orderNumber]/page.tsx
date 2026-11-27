import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUser } from "@/lib/auth/session";
import { getUserOrder } from "@/services/account";
import { getSiteConfig } from "@/config/site";
import { Card, SectionTitle } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { SafeImage } from "@/components/safe-image";
import { ReturnForm } from "@/components/return-form";
import { computeReturnableLines, hasOpenReturnWindow, isReturnEligibleStatus, latestDeliveredAt } from "@/lib/returns";
import { formatJalali, formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";
import { orderStatusLabels, paymentStatusLabels, refundStatusLabels, returnStatusLabels } from "@/lib/labels";

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
  const site = await getSiteConfig();
  const canResume = order.status === "PENDING_PAYMENT" && order.paymentStatus === "PENDING" &&
    order.payments.some((payment) => payment.status === "PENDING");
  const returnEligible = hasOpenReturnWindow(order.status, latestDeliveredAt(order.statusHistory));
  const returnWindowExpired = isReturnEligibleStatus(order.status) && !returnEligible;
  const returnableItems = computeReturnableLines(
    order.items,
    order.returnRequests.filter((request) => request.status !== "REJECTED"),
  );
  const hasReturnableItems = returnableItems.some((item) => item.returnable > 0);
  const hasLegacyActiveReturn = order.returnRequests.some(
    (request) => request.status !== "REJECTED" && request.items.length === 0,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">سفارش <span dir="ltr" className="text-primary">{order.orderNumber}</span></h1>
          <p className="mt-2 text-xs text-ink/55">ثبت شده در {formatJalali(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-4 py-2 text-xs text-primary">{orderStatusLabels[order.status]}</span>
          <span className="rounded-full bg-line px-4 py-2 text-xs text-ink/65">{paymentStatusLabels[order.paymentStatus]}</span>
          {canResume ? (
            <ButtonLink href={`/api/payments/resume?order=${encodeURIComponent(order.orderNumber)}`} size="sm">
              ادامه پرداخت
            </ButtonLink>
          ) : null}
          {returnEligible ? (
            <ButtonLink href="#return-request" variant="outline" size="sm">
              درخواست مرجوعی
            </ButtonLink>
          ) : (
            <ButtonLink href="/policies/returns" variant="ghost" size="sm">
              شرایط مرجوعی
            </ButtonLink>
          )}
        </div>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">کالاها</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-line/70 pb-4 last:border-0 last:pb-0">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-line bg-line/20">
                {item.imageUrl ? <SafeImage src={item.imageUrl} alt={item.productName} fill sizes="64px" className="object-cover" fallbackLabel={item.productName} /> : null}
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

      {order.returnRequests.length ? (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">درخواست‌های بازگشت</h2>
          <div className="space-y-3">
            {order.returnRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-line p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-ink/45">{formatJalali(request.createdAt)}</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{returnStatusLabels[request.status]}</span>
                </div>
                {request.items.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-ink/60">
                    {request.items.map((item) => {
                      const orderItem = order.items.find((entry) => entry.id === item.orderItemId);
                      return <li key={item.orderItemId}>{orderItem?.productName ?? "کالا"} × {formatNumber(item.quantity)}</li>;
                    })}
                  </ul>
                ) : <p className="mt-2 text-xs text-ink/50">کل اقلام سفارش</p>}
                {request.note ? <p className="mt-2 text-xs text-ink/55">پاسخ مدیر: {request.note}</p> : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <section id="return-request" className="scroll-mt-28">
        <SectionTitle
          title="درخواست بازگشت / مرجوعی"
          subtitle={returnEligible
            ? "اقلام و تعداد قابل بازگشت را انتخاب کنید. پس از ثبت، وضعیت درخواست در همین صفحه و بخش مرجوعی‌ها قابل پیگیری است."
            : returnWindowExpired
              ? "مهلت بازگشت این سفارش به پایان رسیده است."
              : "درخواست مرجوعی پس از ارسال سفارش فعال می‌شود. تا آن زمان می‌توانید شرایط بازگشت را مطالعه کنید."}
        />
        {!returnEligible ? (
          <Card className="p-6 text-sm leading-7 text-ink/60">
            {returnWindowExpired ? (
              <>
                مهلت ۷ روزهٔ بازگشت این سفارش به پایان رسیده است. برای پیگیری موارد خاص با پشتیبانی تماس بگیرید. شرایط کامل در{" "}
                <Link href="/policies/returns" className="text-primary underline">سیاست بازگشت کالا</Link> آمده است.
              </>
            ) : (
              <>
                سفارش شما هنوز ارسال نشده است. پس از ثبت ارسال توسط فروشگاه، دکمهٔ «درخواست مرجوعی» در بالای همین صفحه فعال
                می‌شود. برای آشنایی با شرایط، <Link href="/policies/returns" className="text-primary underline">سیاست بازگشت کالا</Link> را ببینید.
              </>
            )}
          </Card>
        ) : hasLegacyActiveReturn ? (
          <Card className="p-6 text-sm text-ink/60">درخواست بازگشت قبلی این سفارش در حال بررسی است.</Card>
        ) : hasReturnableItems ? (
          <ReturnForm orderId={order.id} items={returnableItems} />
        ) : (
          <Card className="p-6 text-sm leading-7 text-ink/60">
            همهٔ اقلام این سفارش قبلاً مرجوع شده یا درخواست بازگشت آن‌ها ثبت شده است.
            {" "}<Link href="/account/returns" className="text-primary underline">مشاهده درخواست‌های من</Link>
          </Card>
        )}
      </section>

      {order.refunds.length ? (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">بازپرداخت‌ها</h2>
          <div className="space-y-2 text-sm">
            {order.refunds.map((refund) => (
              <div key={refund.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line px-3 py-2">
                <span dir="ltr" className="font-medium text-primary">{formatToman(refund.amount)}</span>
                <span className="text-xs text-ink/55">{refundStatusLabels[refund.status]}</span>
                {refund.reference ? <span dir="ltr" className="text-xs text-ink/45">{refund.reference}</span> : null}
                <span className="text-xs text-ink/45">{formatJalali(refund.createdAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {site.store.invoiceFooter ? (
        <Card className="p-5 text-xs leading-6 text-ink/55">{site.store.invoiceFooter}</Card>
      ) : null}
    </div>
  );
}
