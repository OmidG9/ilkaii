import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission, permissionKeysForRole } from "@/lib/auth/session";
import { resolveDateRange } from "@/lib/date-range";
import { REPORT_TYPES, buildReport, reportSearchParams, type ReportGroup, type ReportType } from "@/services/reports";
import { AdminDataTable, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { AdminDateRangePicker } from "@/components/admin/admin-client";
import { PrintButton } from "@/components/admin/print-button";
import { formatJalali, formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "گزارش‌ها" };
export const dynamic = "force-dynamic";

function isReportType(value: string | undefined): value is ReportType {
  return REPORT_TYPES.some((item) => item.key === value);
}

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requirePagePermission("reports.view");
  const permissions = await permissionKeysForRole(user.role);
  const params = await searchParams;
  const type: ReportType = isReportType(typeof params.type === "string" ? params.type : undefined) ? params.type as ReportType : "sales";
  const group: ReportGroup = params.group === "week" || params.group === "month" ? params.group : "day";
  const range = resolveDateRange({
    range: typeof params.range === "string" ? params.range : undefined,
    from: typeof params.from === "string" ? params.from : undefined,
    to: typeof params.to === "string" ? params.to : undefined,
  });
  const report = await buildReport(type, range, group);
  const exportQuery = reportSearchParams(range, type, group);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="مرکز گزارش‌ها"
        description="همه گزارش‌ها از پایگاه داده واقعی محاسبه می‌شوند. بازه زمانی در تقویم تهران است و مقایسه با دوره قبل هم‌طول انجام می‌شود."
        actions={
          <>
            <AdminDateRangePicker />
            <PrintButton />
            {type !== "customers" || permissions.includes("customers.export") ? (
              <Link href={`/api/admin/reports/export?${exportQuery}`} prefetch={false} className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary">خروجی CSV</Link>
            ) : null}
          </>
        }
      />

      <nav className="admin-scroll flex gap-1.5 overflow-x-auto pb-1" aria-label="نوع گزارش">
        {REPORT_TYPES.map((item) => {
          const query = reportSearchParams(range, item.key, group);
          return (
            <Link key={item.key} href={`/admin/reports?${query}`} data-active={type === item.key}
              className={`min-h-9 shrink-0 rounded-xl border px-4 text-xs ${type === item.key ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink/60 hover:border-primary"}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{report.title}</h1>
          <p className="mt-1 max-w-3xl text-[11px] leading-5 text-ink/45">{report.description}</p>
          <p className="mt-1 text-[10px] text-ink/35">{formatJalali(range.from)} تا {formatJalali(range.to)} — {formatNumber(range.days)} روز</p>
        </div>
        {(type === "sales" || type === "revenue") ? (
          <form method="get" className="flex items-center gap-2">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="range" value={range.key} />
            {range.key === "custom" ? <><input type="hidden" name="from" value={typeof params.from === "string" ? params.from : ""} /><input type="hidden" name="to" value={typeof params.to === "string" ? params.to : ""} /></> : null}
            <select name="group" defaultValue={group} className="field min-h-10 max-w-40 text-xs" aria-label="گروه‌بندی">
              <option value="day">روزانه</option>
              <option value="week">هفتگی</option>
              <option value="month">ماهانه</option>
            </select>
            <button type="submit" className="min-h-10 rounded-xl bg-primary px-4 text-xs text-white">اعمال</button>
          </form>
        ) : null}
      </div>

      {report.summary.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {report.summary.map((item) => (
            <AdminStatCard key={item.label} label={item.label} value={item.type === "toman" ? formatToman(Number(item.value)) : item.type === "number" ? formatNumber(Number(item.value)) : String(item.value)} />
          ))}
        </div>
      ) : null}

      <AdminDataTable
        rows={report.rows}
        rowKey={(row, index) => String(row.orderNumber ?? row.period ?? row.sku ?? index)}
        emptyText="در این بازه داده‌ای برای این گزارش وجود ندارد."
        dense
        columns={report.columns.map((column) => ({
          key: column.key,
          header: column.label,
          ltr: column.type === "toman" || column.type === "number" || column.key === "phone" || column.key === "sku",
          render: (row: Record<string, unknown>) => {
            const value = row[column.key];
            if (value === null || value === undefined || value === "") return "—";
            if (column.type === "toman") return formatToman(Number(value));
            if (column.type === "number") return formatNumber(Number(value));
            if (column.type === "date") return formatJalali(String(value));
            return String(value);
          },
        }))}
      />
      <p className="text-[10px] leading-5 text-ink/35">
        {report.rows.length >= 500 ? "نتیجه به ۵۰۰ ردیف محدود شده است؛ برای تحلیل کامل از خروجی CSV استفاده کنید. " : ""}
        محاسبات مالی به تومان و بدون اعشار ذخیره می‌شوند. بازپرداخت‌ها در گزارش درآمد از فروش ناخالص کسر می‌شوند. منطقه زمانی گزارش‌ها Asia/Tehran است.
      </p>
    </div>
  );
}
