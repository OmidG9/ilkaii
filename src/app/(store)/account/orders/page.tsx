import type { Metadata } from "next";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { listUserOrders } from "@/services/account";
import { Card, Pagination, SectionTitle } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { formatJalali, formatNumber } from "@/lib/persian";
import { orderStatusLabels } from "@/lib/labels";
import { formatToman } from "@/lib/money";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "سفارشهای من", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requirePageUser();
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const result = await listUserOrders(user.id, page, 10);
  return (
    <section>
      <SectionTitle title="سفارشهای من" subtitle={`${formatNumber(result.total)} سفارش ثبت شده`} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <p className="text-xs leading-6 text-ink/55">
          برای بازگرداندن کالا، سفارش ارسال‌شده یا تحویل‌شده را انتخاب کنید و از قسمت «درخواست مرجوعی» اقدام کنید.
        </p>
        <ButtonLink href="/account/returns/new" size="sm" variant="outline">ثبت درخواست مرجوعی</ButtonLink>
      </div>
      {result.items.length ? (
        <>
          <div className="space-y-4">
            {result.items.map((order) => (
              <Card key={order.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p dir="ltr" className="text-sm font-semibold text-primary">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-ink/50">{formatJalali(order.createdAt)}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{orderStatusLabels[order.status]}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="text-xs text-ink/60">{formatNumber(order.items.reduce((sum, item) => sum + item.quantity, 0))} کالا</p>
                  <p dir="ltr" className="text-sm font-semibold">{formatToman(order.total)}</p>
                  <div className="flex flex-wrap items-center gap-3">
                    {order.returnWindowOpen ? (
                      <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}#return-request`} className="text-sm font-medium text-primary underline">
                        درخواست مرجوعی
                      </Link>
                    ) : null}
                    <Link href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} className="text-sm font-medium text-primary underline">جزئیات</Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Pagination page={page} pageCount={result.pageCount} pathname="/account/orders" />
        </>
      ) : (
        <Card className="p-8 text-center text-sm text-ink/60">سفارشی یافت نشد.</Card>
      )}
    </section>
  );
}
