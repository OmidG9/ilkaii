import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { listMyReturns } from "@/services/account";
import { Card, SectionTitle } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { formatJalali, formatNumber } from "@/lib/persian";
import { returnStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "درخواستهای بازگشت", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ReturnsPage() {
  const user = await requirePageUser();
  const returns = await listMyReturns(user.id);
  return (
    <section>
      <SectionTitle
        title="مرجوعی‌ها و درخواست‌های بازگشت"
        subtitle="درخواست‌های ثبت‌شده و وضعیت بررسی آن‌ها را اینجا ببینید."
        href="/account/returns/new"
        linkLabel="ثبت درخواست جدید"
      />
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-4 border-primary/20 bg-primary/[0.03] p-4">
        <p className="max-w-2xl text-xs leading-6 text-ink/60">
          برای بازگرداندن کالا، سفارش ارسال‌شده یا تحویل‌شده را انتخاب کنید. مرجوعی تا ۷ روز پس از تحویل و در صورت استفاده
          نشدن کالا امکان‌پذیر است.
        </p>
        <ButtonLink href="/account/returns/new" size="sm">انتخاب سفارش و ثبت درخواست</ButtonLink>
      </Card>
      {returns.length ? (
        <div className="space-y-4">
          {returns.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p dir="ltr" className="text-sm font-semibold text-primary">{item.order.orderNumber}</p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{returnStatusLabels[item.status]}</span>
              </div>
              {item.items.length ? (
                <ul className="mt-3 space-y-1 rounded-xl bg-canvas p-3 text-xs text-ink/65">
                  {item.items.map((line) => (
                    <li key={line.orderItemId}>
                      {line.orderItem.productName}
                      {line.orderItem.variantName ? ` — ${line.orderItem.variantName}` : ""} × {formatNumber(line.quantity)}
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-xs text-ink/45">کل اقلام سفارش</p>}
              <p className="mt-3 text-sm leading-6 text-ink/65">{item.reason}</p>
              {item.note ? <p className="mt-2 rounded-xl bg-canvas p-3 text-xs text-ink/60">پاسخ مدیر: {item.note}</p> : null}
              <p className="mt-3 text-xs text-ink/45">{formatJalali(item.createdAt)}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-ink/55">
          <p>درخواست بازگشتی ثبت نکرده‌اید.</p>
          <div className="mt-4 flex justify-center">
            <ButtonLink href="/account/returns/new" size="sm" variant="outline">ثبت اولین درخواست</ButtonLink>
          </div>
        </Card>
      )}
    </section>
  );
}
