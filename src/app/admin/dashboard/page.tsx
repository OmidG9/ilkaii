import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { resolveDateRange, RANGE_LABELS } from "@/lib/date-range";
import { getDashboardData } from "@/services/dashboard";
import { lowStockVariants } from "@/services/catalog";
import { getInventoryValueSummary } from "@/services/warehouse";
import { cached } from "@/lib/cache";
import { formatToman } from "@/lib/money";
import { formatJalali, formatNumber } from "@/lib/persian";
import { orderStatusLabels } from "@/lib/labels";
import { AdminChart, AdminDataTable, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { AdminDateRangePicker } from "@/components/admin/admin-client";
import type { RawSearchParams } from "@/lib/search-params";
import { ShoppingBag, CircleDollarSign, Users, TrendingUp, PackageMinus, Activity, Warehouse } from "lucide-react";

export const metadata: Metadata = { title: "داشبورد مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("dashboard.view");
  const params = await searchParams;
  const range = resolveDateRange({
    range: typeof params.range === "string" ? params.range : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
  });
  const [data, lowStock, inventoryValue] = await Promise.all([
    cached(`dashboard:${range.from.toISOString()}:${range.to.toISOString()}`, 30_000, () => getDashboardData(range)),
    lowStockVariants(),
    getInventoryValueSummary(),
  ]);
  const delta = data.charts.previousRevenue > 0
    ? Math.round(((data.revenue.gross - data.charts.previousRevenue) / data.charts.previousRevenue) * 100)
    : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="داشبورد"
        description="معیارهای واقعی فروشگاه از پایگاه داده؛ بازه‌ها بر اساس تقویم تهران محاسبه می‌شوند."
        actions={<AdminDateRangePicker />}
      />
      <p className="-mt-3 text-[11px] text-ink/40">
        بازه: {RANGE_LABELS[range.key]} ({formatJalali(range.from)} تا {formatJalali(range.to)}) — مقایسه با دوره قبل: {formatToman(data.charts.previousRevenue)}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="فروش ناخالص" value={formatToman(data.revenue.gross)} delta={delta} hint="پرداخت‌شده در بازه" icon={<CircleDollarSign className="h-5 w-5" />} definition="مجموع مبلغ سفارش‌های پرداخت‌شده؛ پیش از کسر بازپرداخت." />
        <AdminStatCard label="فروش خالص" value={formatToman(data.revenue.net)} hint={`بازپرداخت: ${formatToman(data.revenue.refunds)}`} icon={<TrendingUp className="h-5 w-5" />} definition="فروش ناخالص منهای بازپرداخت‌های ثبت‌شده." tone={data.revenue.refunds > 0 ? "warning" : "default"} />
        <AdminStatCard label="سفارش‌های پرداخت‌شده" value={formatNumber(data.revenue.paidOrders)} hint={`کل سفارش‌ها: ${formatNumber(data.orders.total)}`} icon={<ShoppingBag className="h-5 w-5" />} href="/admin/orders?status=PAID" />
        <AdminStatCard label="میانگین ارزش سفارش" value={data.revenue.averageOrderValue === null ? "—" : formatToman(data.revenue.averageOrderValue)} hint="AOV = فروش ناخالص ÷ سفارش پرداخت‌شده" icon={<Activity className="h-5 w-5" />} />
        <AdminStatCard label="در انتظار پرداخت" value={formatNumber(data.orders.pending)} hint="نیازمند پیگیری" tone={data.orders.pending ? "warning" : "default"} href="/admin/orders?status=PENDING_PAYMENT" />
        <AdminStatCard label="تکمیل‌شده" value={formatNumber(data.orders.completed)} hint="پرداخت تا تحویل" tone="success" href="/admin/orders?status=DELIVERED" />
        <AdminStatCard label="لغو شده" value={formatNumber(data.orders.cancelled)} hint={`بازپرداخت‌شده: ${formatNumber(data.orders.refunded)}`} tone={data.orders.cancelled ? "danger" : "default"} href="/admin/orders?status=CANCELLED" />
        <AdminStatCard label="مشتریان" value={formatNumber(data.customers.total)} hint={`جدید در بازه: ${formatNumber(data.customers.newCustomers)}`} icon={<Users className="h-5 w-5" />} href="/admin/customers" />
        <AdminStatCard label="مشتریان خریدار" value={formatNumber(data.customers.buyers)} hint={`بازگشتی: ${formatNumber(data.customers.returningBuyers)}`} href="/admin/customers" />
        <AdminStatCard label="نرخ تبدیل" value={data.revenue.conversionRate === null ? "—" : `${formatNumber(Math.round(data.revenue.conversionRate * 10) / 10)}٪`} hint={data.revenue.conversionRate === null ? "داده نشست کافی نیست" : `سفارش ÷ ${formatNumber(data.revenue.sessionCount)} نشست`} definition="نرخ تبدیل = سفارش پرداخت‌شده ÷ نشست‌های آغازشده در بازه." />
        <AdminStatCard label="نشست فعال" value={formatNumber(data.revenue.activeSessions)} hint="۳۰ دقیقه اخیر" definition="نشست‌هایی که آخرین رویداد آن‌ها در ۳۰ دقیقه گذشته ثبت شده است." />
        <AdminStatCard label="موجودی کم" value={formatNumber(data.lowStockCount)} hint="تنوع‌های زیر آستانه" tone={data.lowStockCount ? "danger" : "success"} icon={<PackageMinus className="h-5 w-5" />} href="/admin/inventory?stock=low" />
        <AdminStatCard label="ارزش موجودی انبار" value={formatToman(inventoryValue.costValue)} hint={`${formatNumber(inventoryValue.units)} واحد — ارزش فروش ${formatToman(inventoryValue.retailValue)}`} icon={<Warehouse className="h-5 w-5" />} href="/admin/inventory" definition="مجموع موجودی × بهای خرید ثبت‌شده؛ برای ارزش‌گذاری دقیق، بهای خرید تنوع‌ها را تکمیل کنید." />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminChart title="روند فروش روزانه" subtitle="مبلغ سفارش‌های پرداخت‌شده (تومان)" data={data.charts.salesDaily} type="line" valueLabel="تومان" formatValue={(value) => formatToman(value)} />
        <AdminChart title="روند سفارش‌ها" subtitle="تعداد سفارش ثبت‌شده در هر روز" data={data.charts.ordersDaily} type="bar" valueLabel="سفارش" />
        <AdminChart title="روند بازدید" subtitle="نشست‌های یکتای ثبت‌شده توسط تحلیل داخلی" data={data.charts.visitorsDaily} type="line" valueLabel="نشست" emptyText="هنوز داده تحلیلی در این بازه ثبت نشده است." />
        <AdminChart title="فروش بر اساس دسته‌بندی" subtitle="سهم دسته‌بندی‌ها از مبلغ اقلام فروخته‌شده" data={data.charts.salesByCategory} type="donut" valueLabel="تومان" formatValue={(value) => formatToman(value)} />
        <AdminChart title="پرفروش‌ترین محصولات" subtitle="بر اساس مبلغ فروش" data={data.charts.salesByProduct} type="bar" valueLabel="تومان" formatValue={(value) => formatToman(value)} />
        <section className="admin-panel p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">منابع ترافیک</h2>
              <p className="mt-1 text-[11px] text-ink/45">بر اساس UTM نشست‌های ثبت‌شده و رویداد خرید همان نشست</p>
            </div>
          </div>
          {data.charts.trafficSources.length ? (
            <div className="table-wrap border-0">
              <table className="table-luxury min-w-0">
                <thead><tr><th>منبع</th><th>نشست</th><th>خرید</th><th>درآمد</th></tr></thead>
                <tbody>
                  {data.charts.trafficSources.map((source) => (
                    <tr key={source.label}>
                      <td dir="auto" className="text-xs">{source.label}</td>
                      <td>{formatNumber(source.value)}</td>
                      <td>{formatNumber(source.purchases)}</td>
                      <td dir="ltr" className="text-xs">{formatToman(source.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="rounded-xl border border-dashed border-line p-8 text-center text-xs text-ink/45">داده ترافیک هنوز در دسترس نیست؛ با شروع جمع‌آوری رویدادها پر می‌شود.</p>}
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">سفارش‌های اخیر</h2>
            <Link href="/admin/orders" className="text-xs text-primary hover:underline">همه سفارش‌ها</Link>
          </div>
          <AdminDataTable
            rows={data.recentOrders}
            rowKey={(row) => row.id}
            emptyText="در این بازه سفارشی ثبت نشده است."
            columns={[
              { key: "orderNumber", header: "سفارش", ltr: true, render: (row) => <Link href={`/admin/orders/${row.id}`} className="text-xs font-medium text-primary hover:underline">{row.orderNumber}</Link> },
              { key: "createdAt", header: "تاریخ", render: (row) => <span className="text-xs">{formatJalali(row.createdAt, true)}</span> },
              { key: "status", header: "وضعیت", render: (row) => <span className="text-xs">{orderStatusLabels[row.status as keyof typeof orderStatusLabels]}</span> },
              { key: "total", header: "مبلغ", ltr: true, render: (row) => <span className="text-xs">{formatToman(row.total)}</span> },
            ]}
          />
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">هشدار موجودی</h2>
            <Link href="/admin/inventory" className="text-xs text-primary hover:underline">مدیریت موجودی</Link>
          </div>
          <div className="admin-panel overflow-hidden">
            <ul className="divide-y divide-line/70">
              {lowStock.slice(0, 8).map((variant) => (
                <li key={variant.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/products/${variant.product.id}`} className="block truncate text-xs font-medium hover:text-primary">{variant.product.name}</Link>
                    <span dir="ltr" className="mt-0.5 block text-[10px] text-ink/40">{variant.sku}</span>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${variant.stock === 0 ? "text-red-600" : "text-amber-600"}`}>{formatNumber(variant.stock)}</span>
                </li>
              ))}
              {!lowStock.length ? <li className="px-4 py-10 text-center text-xs text-ink/45">همه تنوع‌ها موجودی کافی دارند.</li> : null}
            </ul>
          </div>
        </section>
      </div>

      <section className="admin-panel p-5">
        <h2 className="mb-3 text-sm font-semibold">پرفروش‌ترین محصولات در بازه</h2>
        <AdminDataTable
          rows={data.bestSellers}
          rowKey={(row) => row.id}
          emptyText="فروشی در این بازه ثبت نشده است."
          columns={[
            { key: "name", header: "محصول", render: (row) => <Link href={`/admin/products/${row.id}`} className="text-xs font-medium hover:text-primary">{row.name}</Link> },
            { key: "quantity", header: "تعداد فروش", render: (row) => formatNumber(row.quantity) },
            { key: "revenue", header: "مبلغ", ltr: true, render: (row) => formatToman(row.revenue) },
          ]}
        />
      </section>

      <p className="text-[10px] leading-5 text-ink/35">
        تعاریف: فروش ناخالص مجموع مبلغ سفارش‌های پرداخت‌شده در بازه است. فروش خالص بازپرداخت‌های ثبت‌شده در همان بازه را کسر می‌کند. درآمد ارسال و تخفیف جداگانه نمایش داده می‌شود. نرخ تبدیل فقط با داده واقعی نشست محاسبه می‌شود و در نبود داده «—» است.
      </p>
    </div>
  );
}
