import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { resolveDateRange, RANGE_LABELS } from "@/lib/date-range";
import { listAnalyticsSessions } from "@/services/analytics";
import { AdminDataTable, AdminFilters, AdminPageHeader, AdminPagination } from "@/components/admin/admin-widgets";
import { AdminDateRangePicker } from "@/components/admin/admin-client";
import { formatJalali, formatNumber } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "نشست‌های تحلیلی" };
export const dynamic = "force-dynamic";

const deviceLabels: Record<string, string> = { mobile: "موبایل", tablet: "تبلت", desktop: "دسکتاپ" };

export default async function AdminAnalyticsSessionsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("analytics.view");
  const params = await searchParams;
  const range = resolveDateRange({
    range: typeof params.range === "string" ? params.range : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
  });
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const device = typeof params.device === "string" ? params.device : "";
  const source = typeof params.source === "string" ? params.source.slice(0, 160) : "";
  const result = await listAnalyticsSessions({ range, page, pageSize: 25, device: device || undefined, source: source || undefined });

  return (
    <div>
      <AdminPageHeader
        title="نشست‌های تحلیلی"
        description="نمای حریم‌محور نشست‌های ناشناس. محتوای فرم‌ها، رمزها، کدهای یک‌بارمصرف و اطلاعات پرداخت هرگز ثبت نمی‌شوند."
        actions={<AdminDateRangePicker />}
      />
      <p className="-mt-4 mb-4 text-[11px] text-ink/40">{RANGE_LABELS[range.key]} — {formatJalali(range.from)} تا {formatJalali(range.to)} — {formatNumber(result.total)} نشست</p>
      <AdminFilters resetHref="/admin/analytics/sessions">
        <select name="device" defaultValue={device} className="field max-w-40" aria-label="دستگاه">
          <option value="">همه دستگاه‌ها</option>
          <option value="mobile">موبایل</option>
          <option value="tablet">تبلت</option>
          <option value="desktop">دسکتاپ</option>
        </select>
        <input name="source" defaultValue={source} placeholder="منبع UTM" className="field max-w-44" dir="ltr" aria-label="منبع" />
      </AdminFilters>
      <AdminDataTable
        rows={result.items}
        rowKey={(session) => session.id}
        emptyText="نشستی در این بازه یافت نشد."
        columns={[
          { key: "id", header: "نشست", ltr: true, render: (session) => <Link href={`/admin/analytics/sessions/${session.id}`} className="text-[10px] font-medium text-primary hover:underline">{session.id.slice(0, 10)}…</Link> },
          { key: "customer", header: "مشتری", render: (session) => session.customer ? <span dir="ltr" className="text-[11px]">{session.customer.phone}</span> : <span className="text-[10px] text-ink/40">مهمان</span> },
          { key: "device", header: "دستگاه", render: (session) => <span className="text-[11px]">{deviceLabels[session.device ?? ""] ?? "—"}</span> },
          { key: "source", header: "منبع", render: (session) => <span className="text-[11px]">{session.utmSource ?? "direct"}{session.utmCampaign ? ` / ${session.utmCampaign}` : ""}</span> },
          { key: "entryPath", header: "ورود", ltr: true, render: (session) => <span className="block max-w-48 truncate text-[10px] text-ink/55">{session.entryPath ?? "—"}</span> },
          { key: "pageViews", header: "صفحه", render: (session) => formatNumber(session.pageViews) },
          { key: "eventCount", header: "رویداد", render: (session) => formatNumber(session.eventCount) },
          { key: "lastSeenAt", header: "آخرین فعالیت", render: (session) => <span className="text-[11px]">{formatJalali(session.lastSeenAt, true)}</span> },
        ]}
      />
      <AdminPagination page={page} pageCount={result.pageCount} pathname="/admin/analytics/sessions" params={{ range: range.key, device: device || undefined, source: source || undefined }} />
    </div>
  );
}
