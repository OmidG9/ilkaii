import type { Metadata } from "next";
import { listAuditLogs } from "@/services/admin";
import { Card, Pagination, SectionTitle } from "@/components/ui/display";
import { formatJalali } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "گزارشها — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const result = await listAuditLogs(page, 30);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-semibold">گزارش رویدادها</h1>
        <p className="text-sm text-ink/60">کلیه اقدامات مهم مدیران ثبت میشود و قابل پاکسازی توسط کاربران عادی نیست.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="table-wrap">
          <table className="table-luxury">
            <thead><tr><th>تاریخ</th><th>عملیات</th><th>موجودیت</th><th>شناسه</th><th>کاربر</th><th>جزئیات</th></tr></thead>
            <tbody>
              {result.items.map((log) => (
                <tr key={log.id}>
                  <td>{formatJalali(log.createdAt)}</td>
                  <td dir="ltr" className="text-xs">{log.action}</td>
                  <td>{log.entity}</td>
                  <td dir="ltr" className="max-w-40 truncate text-xs text-ink/55">{log.entityId ?? "—"}</td>
                  <td dir="ltr" className="text-xs">{log.actorId ?? "سیستم"}</td>
                  <td className="max-w-sm truncate text-xs text-ink/55">{log.metadata ? JSON.stringify(log.metadata) : "—"}</td>
                </tr>
              ))}
              {!result.items.length ? <tr><td colSpan={6} className="py-10 text-center text-ink/50">گزارشی ثبت نشده است.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination page={page} pageCount={result.pageCount} pathname="/admin/audit" />
      <SectionTitle title="امنیت" subtitle="برای مشاهده جزئیات کیفیت کد و استقرار، به اسناد پروژه مراجعه کنید." />
    </div>
  );
}
