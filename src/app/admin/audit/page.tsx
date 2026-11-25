import type { Metadata } from "next";
import { requirePageAnyPermission } from "@/lib/auth/session";
import { listAuditLogs } from "@/services/admin";
import { AdminDataTable, AdminFilters, AdminPageHeader, AdminPagination } from "@/components/admin/admin-widgets";
import { formatJalali } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "گزارش اقدامات" };
export const dynamic = "force-dynamic";

const severities = ["info", "warn", "critical"] as const;

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePageAnyPermission("audit.view", "audit.read");
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const severity = typeof params.severity === "string" && severities.includes(params.severity as never) ? params.severity : "";
  const entity = typeof params.entity === "string" ? params.entity.slice(0, 80) : "";
  const result = await listAuditLogs(page, 30, { q: q || undefined, severity: severity || undefined, entity: entity || undefined });

  return (
    <div>
      <AdminPageHeader
        title="گزارش اقدامات"
        description="هر اقدام حساس مدیران با شناسه درخواست، کاربر، زمان و در صورت لزوم تصویر قبل/بعد ثبت می‌شود. رازها و اطلاعات کارت هرگز در گزارش نوشته نمی‌شوند."
      />
      <AdminFilters resetHref="/admin/audit">
        <input name="q" defaultValue={q} placeholder="اقدام، موبایل، شناسه یا requestId" className="field max-w-xs flex-1" dir="ltr" aria-label="جستجوی گزارش" />
        <select name="severity" defaultValue={severity} className="field max-w-40" aria-label="شدت">
          <option value="">همه شدت‌ها</option>
          <option value="info">عادی</option>
          <option value="warn">هشدار</option>
          <option value="critical">حساس</option>
        </select>
        <input name="entity" defaultValue={entity} placeholder="نوع موجودیت" className="field max-w-40" dir="ltr" aria-label="موجودیت" />
      </AdminFilters>

      <AdminDataTable
        rows={result.items}
        rowKey={(log) => log.id}
        emptyText="گزارشی با این فیلترها یافت نشد."
        footer={<span>مجموع: {result.total.toLocaleString("fa-IR")} گزارش</span>}
        columns={[
          { key: "createdAt", header: "زمان", render: (log) => <span className="whitespace-nowrap text-[11px]">{formatJalali(log.createdAt, true)}</span> },
          { key: "action", header: "اقدام", ltr: true, render: (log) => <span className="text-[11px] font-medium">{log.action}</span> },
          { key: "entity", header: "موجودیت", render: (log) => <div><p className="text-[11px]">{log.entity}</p><p dir="ltr" className="text-[9px] text-ink/40">{log.entityId ?? "—"}</p></div> },
          { key: "actor", header: "کاربر", render: (log) => <span dir="ltr" className="text-[11px]">{log.actorPhone ?? log.actorId ?? "سیستم"}</span> },
          { key: "severity", header: "شدت", render: (log) => <span className={`rounded-full px-2 py-0.5 text-[10px] ${log.severity === "critical" ? "bg-red-500/10 text-red-600" : log.severity === "warn" ? "bg-amber-500/10 text-amber-700" : "bg-line text-ink/50"}`}>{log.severity}</span> },
          { key: "details", header: "جزئیات", render: (log) => (
            <details className="max-w-sm">
              <summary className="cursor-pointer text-[10px] text-primary">مشاهده</summary>
              <div dir="ltr" className="mt-2 max-h-48 space-y-1 overflow-auto rounded-lg bg-canvas p-2 text-[9px] leading-4 text-ink/55">
                <p><strong>requestId:</strong> {log.requestId ?? "—"}</p>
                <p><strong>metadata:</strong> {log.metadata ?? "—"}</p>
                {log.beforeJson ? <p><strong>before:</strong> {log.beforeJson}</p> : null}
                {log.afterJson ? <p><strong>after:</strong> {log.afterJson}</p> : null}
              </div>
            </details>
          ) },
        ]}
      />
      <AdminPagination page={page} pageCount={result.pageCount} pathname="/admin/audit" params={{ q: q || undefined, severity: severity || undefined, entity: entity || undefined }} />
    </div>
  );
}
