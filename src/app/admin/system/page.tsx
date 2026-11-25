import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { getSystemOverview } from "@/services/system";
import { AdminDataTable, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { MaintenanceButton } from "@/components/admin/maintenance-button";
import { Alert } from "@/components/ui/display";
import { formatJalali, formatNumber, formatSeconds } from "@/lib/persian";

export const metadata: Metadata = { title: "سلامت سیستم" };
export const dynamic = "force-dynamic";

const levelTone: Record<string, string> = {
  INFO: "bg-line text-ink/55",
  WARN: "bg-amber-500/10 text-amber-700",
  ERROR: "bg-red-500/10 text-red-600",
  CRITICAL: "bg-red-500/20 text-red-700",
};

export default async function AdminSystemPage() {
  await requirePagePermission("system.view");
  const data = await getSystemOverview();
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="سلامت سیستم"
        description="وضعیت اپلیکیشن، پایگاه داده، خطاها و ذخیره‌سازی. این صفحه هیچ کلید زیرساختی یا محتوای لاگ خام را افشا نمی‌کند."
        actions={<MaintenanceButton />}
      />
      {data.health.status !== "ok" ? <Alert tone={data.health.status === "down" ? "error" : "info"}>وضعیت سیستم: {data.health.status === "down" ? "قطع" : "کاهش کارایی"} — بررسی پایگاه داده {data.health.database.connected ? "موفق" : "ناموفق"}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="وضعیت اپلیکیشن" value={data.health.status === "ok" ? "سالم" : data.health.status === "degraded" ? "کاهش کارایی" : "قطع"} hint={`Uptime: ${formatSeconds(data.health.app.uptimeSeconds)}`} tone={data.health.status === "ok" ? "success" : data.health.status === "degraded" ? "warning" : "danger"} />
        <AdminStatCard label="پایگاه داده" value={data.health.database.connected ? `${formatNumber(data.health.database.latencyMs ?? 0)} ms` : "قطع"} hint="تأخیر SELECT 1" tone={data.health.database.connected ? "success" : "danger"} />
        <AdminStatCard label="پرداخت‌های ناموفق ۲۴ ساعت" value={formatNumber(data.failedPayments)} tone={data.failedPayments ? "danger" : "default"} />
        <AdminStatCard label="کارهای ناموفق" value={formatNumber(data.failedJobs)} tone={data.failedJobs ? "danger" : "default"} />
        <AdminStatCard label="حافظه فرایند" value={`${formatNumber(data.health.app.memoryMb)} MB`} hint={`${data.host.cpus} CPU — کل ${formatNumber(data.host.totalMemoryMb)} MB`} />
        <AdminStatCard label="ذخیره‌سازی رسانه" value={`${formatNumber(Math.round(data.storage.mediaBytes / 1024))} KB`} hint={`${formatNumber(data.storage.mediaFiles)} فایل`} />
        <AdminStatCard label="آخرین پشتیبان‌گیری" value={data.backup.lastRunAt ? formatJalali(data.backup.lastRunAt, true) : "ثبت نشده"} hint={`دوره: ${data.backup.frequency}`} />
        <AdminStatCard label="رویدادهای تحلیلی" value={formatNumber(data.counts.analyticsEvents)} hint={`${formatNumber(data.counts.users)} کاربر — ${formatNumber(data.counts.orders)} سفارش`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold">خطاها و هشدارهای اخیر</h2>
          <AdminDataTable
            rows={data.events}
            rowKey={(event) => event.id}
            emptyText="رویداد سیستمی ثبت نشده است."
            dense
            columns={[
              { key: "createdAt", header: "زمان", render: (event) => <span className="text-[10px]">{formatJalali(event.createdAt, true)}</span> },
              { key: "level", header: "سطح", render: (event) => <span className={`rounded-full px-2 py-0.5 text-[9px] ${levelTone[event.level] ?? ""}`}>{event.level}</span> },
              { key: "type", header: "نوع", ltr: true, render: (event) => <span className="text-[10px]">{event.type}</span> },
              { key: "message", header: "پیام", render: (event) => <span className="block max-w-72 truncate text-[10px]">{event.message}</span> },
            ]}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold">کارهای پس‌زمینه</h2>
          <AdminDataTable
            rows={data.recentJobs}
            rowKey={(job) => job.id}
            emptyText="کاری ثبت نشده است."
            dense
            columns={[
              { key: "createdAt", header: "زمان", render: (job) => <span className="text-[10px]">{formatJalali(job.createdAt, true)}</span> },
              { key: "name", header: "نام", ltr: true, render: (job) => <span className="text-[10px]">{job.name}</span> },
              { key: "status", header: "وضعیت", render: (job) => <span className={`text-[10px] ${job.status === "FAILED" ? "text-red-600" : job.status === "SUCCESS" ? "text-emerald-700" : "text-ink/55"}`}>{job.status}</span> },
              { key: "error", header: "خطا", render: (job) => <span className="block max-w-64 truncate text-[9px] text-ink/45">{job.error ?? job.result ?? "—"}</span> },
            ]}
          />
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">رویدادهای امنیتی ۲۴ ساعت</h2>
        <AdminDataTable
          rows={data.securityEvents}
          rowKey={(event) => event.id}
          emptyText="رویداد امنیتی حساسی ثبت نشده است."
          dense
          columns={[
            { key: "createdAt", header: "زمان", render: (event) => <span className="text-[10px]">{formatJalali(event.createdAt, true)}</span> },
            { key: "action", header: "اقدام", ltr: true, render: (event) => <span className="text-[10px]">{event.action}</span> },
            { key: "entity", header: "موجودیت", render: (event) => <span className="text-[10px]">{event.entity}</span> },
            { key: "severity", header: "شدت", render: (event) => <span className="text-[10px]">{event.severity}</span> },
            { key: "requestId", header: "Request ID", ltr: true, render: (event) => <span className="text-[9px] text-ink/40">{event.requestId ?? "—"}</span> },
          ]}
        />
      </section>

      <section className="admin-panel p-5">
        <h2 className="mb-3 text-sm font-semibold">وابستگی‌ها و هشدارها</h2>
        <ul className="space-y-2 text-xs leading-6 text-ink/60">
          <li>Next.js {data.versions.next} — Prisma {data.versions.prisma} — Node {data.versions.node}</li>
          <li>هشدارهای امنیتی وابستگی‌ها در مستند <code className="rounded bg-canvas px-1">docs/SECURITY_AUDIT.md</code> پیگیری می‌شوند.</li>
          <li>محدودسازی نرخ و صف رویدادها در حافظه فرایند است؛ برای استقرار چندنمونه‌ای از Redis استفاده کنید.</li>
          <li>ارسال پیامک/ایمیل واقعی فقط با رازهای معتبر و در محیط تولید انجام می‌شود؛ آداپتور آزمایشی در تولید مسدود است.</li>
          <li>فایل پشتیبان را خارج از سرور نگهداری کنید؛ این پنل فقط وضعیت را نمایش می‌دهد.</li>
        </ul>
      </section>
    </div>
  );
}
