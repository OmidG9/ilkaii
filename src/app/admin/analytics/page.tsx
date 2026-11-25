import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission, permissionKeysForRole } from "@/lib/auth/session";
import { resolveDateRange, RANGE_LABELS } from "@/lib/date-range";
import { getAnalyticsDashboard } from "@/services/analytics";
import { cached } from "@/lib/cache";
import { AdminChart, AdminDataTable, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { AdminDateRangePicker } from "@/components/admin/admin-client";
import { formatJalali, formatNumber, formatSeconds } from "@/lib/persian";
import { formatToman } from "@/lib/money";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "تحلیل رفتار" };
export const dynamic = "force-dynamic";

function percent(value: number | null, digits = 1) {
  return value === null ? "—" : `${formatNumber(Math.round(value * 10 ** digits) / 10 ** digits)}٪`;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requirePagePermission("analytics.view");
  const permissions = await permissionKeysForRole(user.role);
  const params = await searchParams;
  const range = resolveDateRange({
    range: typeof params.range === "string" ? params.range : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
  });
  const data = await cached(`analytics:${range.from.toISOString()}:${range.to.toISOString()}`, 30_000, () => getAnalyticsDashboard(range));
  const hasTraffic = data.overview.sessions > 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تحلیل رفتار"
        description="داده‌های رفتاری از نسخه اول جمع‌آوری می‌شوند. همه اعداد از رویدادهای واقعی و سفارش‌ها محاسبه شده‌اند؛ معیارهای نیازمند داده بیشتر با «—» نمایش داده می‌شوند."
        actions={<AdminDateRangePicker />}
      />
      <p className="-mt-3 text-[11px] text-ink/40">
        {RANGE_LABELS[range.key]} — {formatJalali(range.from)} تا {formatJalali(range.to)} —{" "}
        <Link href="/admin/analytics/sessions" className="text-primary hover:underline">مشاهده نشست‌ها</Link> —{" "}
        {permissions.includes("analytics.export") ? <Link href={`/api/admin/analytics/export?range=${range.key}`} className="text-primary hover:underline">خروجی CSV</Link> : null}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="نشست‌ها" value={formatNumber(data.overview.sessions)} hint={`بازدید صفحه: ${formatNumber(data.overview.pageViews)}`} />
        <AdminStatCard label="میانگین مدت نشست" value={formatSeconds(data.overview.averageSessionSeconds)} hint={`صفحه در نشست: ${formatNumber(Math.round(data.overview.pageViewsPerSession * 10) / 10)}`} />
        <AdminStatCard label="نرخ پرش" value={percent(data.overview.bounceRate)} hint="نشست‌های تک‌رویدادی" tone={data.overview.bounceRate > 70 ? "warning" : "default"} />
        <AdminStatCard label="بازدیدکننده جدید" value={formatNumber(data.overview.newVisitors)} hint={`بازگشتی: ${formatNumber(data.overview.returningVisitors)}`} />
        <AdminStatCard label="نرخ افزودن به سبد" value={percent(data.products.addToCartRate)} hint="از نشست‌های دارای مشاهده محصول" />
        <AdminStatCard label="رهاشدگی محصول" value={percent(data.products.abandonmentRate)} hint="مشاهده محصول بدون افزودن به سبد" tone={data.products.abandonmentRate && data.products.abandonmentRate > 70 ? "warning" : "default"} />
        <AdminStatCard label="نرخ خرید مجدد" value={percent(data.behavior.repeatRate)} hint={`${formatNumber(data.behavior.repeatBuyers)} خریدار تکراری`} />
        <AdminStatCard label="میانگین زمان تا اولین خرید" value={data.behavior.averageDaysToFirstPurchase === null ? "—" : `${formatNumber(data.behavior.averageDaysToFirstPurchase)} روز`} hint="مشتریان جدید با خرید در بازه" definition="از تاریخ عضویت تا اولین سفارش پرداخت‌شده." />
      </div>

      {!hasTraffic ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-8 text-center text-sm text-ink/50">
          در این بازه رویداد تحلیلی ثبت نشده است. با بازدید فروشگاه، داده‌ها به‌صورت خودکار جمع‌آوری می‌شوند.
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminChart title="منابع ترافیک" subtitle="نشست‌ها بر اساس UTM یا ورود مستقیم" data={data.traffic.sources.map((row) => ({ label: row.label, value: row.value }))} type="donut" valueLabel="نشست" />
        <AdminChart title="توزیع دستگاه" subtitle="نشست‌های یکتای ثبت‌شده" data={data.traffic.devices.map((row) => ({ label: row.label === "mobile" ? "موبایل" : row.label === "tablet" ? "تبلت" : "دسکتاپ", value: row.value }))} type="donut" valueLabel="نشست" />
        <AdminChart title="صفحات ورودی" subtitle="Landing pages" data={data.traffic.landingPages} type="bar" valueLabel="نشست" />
        <AdminChart title="صفحات خروجی" subtitle="Exit pages" data={data.traffic.exitPages} type="bar" valueLabel="نشست" />
      </div>

      <section className="admin-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">قیف تبدیل</h2>
            <p className="mt-1 text-[11px] text-ink/45">کاربران یکتای هر مرحله؛ درصد نسبت به شروع و مرحله قبل. زمان میانگین از ابتدای نشست تا اولین رویداد هر مرحله است.</p>
          </div>
          <span className="admin-chip">Visitors → Purchase</span>
        </div>
        <div className="space-y-3">
          {data.funnel.map((stage) => {
            const width = Math.max(4, Math.min(100, stage.fromStart ?? 0));
            return (
              <div key={stage.key}>
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-medium">{stage.label}</span>
                  <span className="text-ink/50">
                    {formatNumber(stage.sessions)} کاربر — از شروع {percent(stage.fromStart)} — از مرحله قبل {percent(stage.fromPrevious)} — ریزش {percent(stage.dropOff)} — زمان {stage.averageSecondsToStage === null ? "—" : formatSeconds(stage.averageSecondsToStage)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-line/60">
                  <div className="h-full rounded-full bg-primary/80" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">تحلیل محصول</h2>
        <AdminDataTable
          rows={data.products.rows}
          rowKey={(row) => row.id}
          emptyText="در این بازه مشاهده محصولی ثبت نشده است."
          columns={[
            { key: "name", header: "محصول", render: (row) => <Link href={`/admin/products/${row.id}`} className="text-xs font-medium hover:text-primary">{row.name}</Link> },
            { key: "views", header: "مشاهده", render: (row) => formatNumber(row.views) },
            { key: "purchases", header: "خرید", render: (row) => formatNumber(row.purchases) },
            { key: "conversion", header: "تبدیل", render: (row) => percent(row.conversion, 2) },
            { key: "revenue", header: "درآمد", ltr: true, render: (row) => formatToman(row.revenue) },
          ]}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminChart title="توزیع انتخاب سایز" subtitle="رویدادهای variant_selected" data={data.products.sizeDistribution} type="bar" valueLabel="انتخاب" />
        <AdminChart title="توزیع انتخاب رنگ" subtitle="رویدادهای variant_selected" data={data.products.colorDistribution} type="bar" valueLabel="انتخاب" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="admin-panel p-5">
          <h2 className="mb-3 text-sm font-semibold">جستجوها</h2>
          <AdminDataTable
            rows={data.search.keywords}
            rowKey={(row) => row.label}
            emptyText="جستجویی ثبت نشده است."
            dense
            columns={[
              { key: "label", header: "عبارت" },
              { key: "searches", header: "تعداد", render: (row) => formatNumber(row.searches) },
              { key: "zeroResults", header: "بدون نتیجه", render: (row) => row.zeroResults ? <span className="text-red-600">{formatNumber(row.zeroResults)}</span> : "۰" },
            ]}
          />
          <p className="mt-3 text-[10px] text-ink/40">نرخ جستجو به مشاهده محصول: {percent(data.search.toProductViewRate)} — نرخ جستجو به خرید: {percent(data.search.toPurchaseRate)}</p>
        </section>

        <section className="admin-panel p-5">
          <h2 className="mb-3 text-sm font-semibold">کمپین‌ها</h2>
          <AdminDataTable
            rows={data.campaigns}
            rowKey={(row) => `${row.source}-${row.medium}-${row.campaign}`}
            emptyText="نشست کمپینی ثبت نشده است."
            dense
            columns={[
              { key: "source", header: "منبع" },
              { key: "campaign", header: "کمپین" },
              { key: "sessions", header: "نشست", render: (row) => formatNumber(row.sessions) },
              { key: "purchases", header: "خرید", render: (row) => formatNumber(row.purchases) },
              { key: "revenue", header: "درآمد", ltr: true, render: (row) => formatToman(row.revenue) },
            ]}
          />
        </section>
      </div>

      <section className="admin-panel p-5">
        <h2 className="mb-3 text-sm font-semibold">رفتار مشتری</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-canvas p-4"><p className="text-[11px] text-ink/45">خریداران (کل تاریخچه)</p><p className="mt-1 text-lg font-semibold">{formatNumber(data.behavior.buyers)}</p></div>
          <div className="rounded-xl bg-canvas p-4"><p className="text-[11px] text-ink/45">فراوانی خرید</p><p className="mt-1 text-lg font-semibold">{data.behavior.purchaseFrequency === null ? "—" : formatNumber(Math.round(data.behavior.purchaseFrequency * 10) / 10)}</p></div>
          <div className="rounded-xl bg-canvas p-4"><p className="text-[11px] text-ink/45">ارزش عمر مشتری (CLV)</p><p className="mt-1 text-lg font-semibold">{data.behavior.averageLifetimeValue === null ? "—" : formatToman(data.behavior.averageLifetimeValue)}</p><p className="mt-1 text-[9px] text-ink/40">{data.behavior.lifetimeValueConfidence === "observed" ? "مشاهده‌شده" : "داده کافی نیست (کمتر از ۲۰ خریدار)"}</p></div>
          <div className="rounded-xl bg-canvas p-4"><p className="text-[11px] text-ink/45">سفارش‌های بازه</p><p className="mt-1 text-lg font-semibold">{formatNumber(data.behavior.orders)}</p><p className="mt-1 text-[9px] text-ink/40">{formatToman(data.behavior.revenue)}</p></div>
        </div>
      </section>

      {data.products.highViewsLowPurchase.length ? (
        <section className="admin-panel border-amber-400/40 p-5">
          <h2 className="mb-2 text-sm font-semibold">محصولات با بازدید بالا و خرید کم</h2>
          <p className="mb-3 text-[11px] text-ink/45">حداقل ۱۰ مشاهده و بدون خرید در بازه. این موارد نیازمند بررسی قیمت، تصویر یا موجودی هستند.</p>
          <div className="flex flex-wrap gap-2">
            {data.products.highViewsLowPurchase.slice(0, 12).map((row) => (
              <Link key={row.id} href={`/admin/products/${row.id}`} className="admin-chip hover:border-primary">{row.name} — {formatNumber(row.views)} مشاهده</Link>
            ))}
          </div>
        </section>
      ) : null}

      <p className="text-[10px] leading-5 text-ink/35">
        فرمول‌ها: نرخ تبدیل = سفارش پرداخت‌شده ÷ نشست. نرخ افزودن به سبد = نشست‌های دارای افزودن به سبد ÷ نشست‌های دارای مشاهده محصول. قیف بر اساس نشست‌های یکتاست و رویدادهای تکراری حذف می‌شوند. درآمد کمپین فقط از رویداد خرید همان نشست محاسبه می‌شود و ممکن است با گزارش مالی سفارش‌ها تفاوت جزئی داشته باشد.
      </p>
    </div>
  );
}
