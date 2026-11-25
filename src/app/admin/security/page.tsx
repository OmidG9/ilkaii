import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listActiveSessions } from "@/services/rbac";
import { prisma } from "@/lib/db";
import { AdminDataTable, AdminPageHeader, AdminPagination } from "@/components/admin/admin-widgets";
import { ConfirmButton } from "@/components/admin/admin-client";
import { formatJalali } from "@/lib/persian";
import { roleLabel } from "@/lib/permissions";
import { Alert } from "@/components/ui/display";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "امنیت و نشست‌ها" };
export const dynamic = "force-dynamic";

export default async function AdminSecurityPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("users.manage");
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const [sessions, events] = await Promise.all([
    listActiveSessions(page, 20),
    prisma.auditLog.findMany({
      where: { severity: { in: ["warn", "critical"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, action: true, entity: true, entityId: true, actorPhone: true, requestId: true, createdAt: true, severity: true, ip: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="امنیت و نشست‌ها" description="نشست‌های فعال مدیران و رویدادهای حساس امنیتی. توکن نشست هرگز به مرورگر بازگردانده نمی‌شود." />
      <Alert tone="info">محدودسازی نرخ درخواست در حافظه فرایند اجرا می‌شود؛ برای استقرار چندنمونه‌ای باید به Redis یا ذخیره‌سازی مشترک منتقل شود.</Alert>

      <section>
        <h2 className="mb-3 text-sm font-semibold">نشست‌های فعال ({sessions.total})</h2>
        <AdminDataTable
          rows={sessions.items}
          rowKey={(session) => session.id}
          emptyText="نشست فعالی وجود ندارد."
          columns={[
            { key: "user", header: "کاربر", render: (session) => (
              <div>
                <p className="text-xs font-medium">{[session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.phone}</p>
                <p dir="ltr" className="mt-0.5 text-[10px] text-ink/45">{session.user.phone} — {roleLabel(session.user.role)}</p>
              </div>
            ) },
            { key: "ip", header: "IP", ltr: true, render: (session) => <span className="text-[11px]">{session.ip ?? "—"}</span> },
            { key: "userAgent", header: "مرورگر", render: (session) => <span dir="ltr" className="block max-w-72 truncate text-[10px] text-ink/50">{session.userAgent ?? "—"}</span> },
            { key: "lastUsedAt", header: "آخرین فعالیت", render: (session) => <span className="text-[11px]">{formatJalali(session.lastUsedAt, true)}</span> },
            { key: "expiresAt", header: "انقضا", render: (session) => <span className="text-[11px]">{formatJalali(session.expiresAt)}</span> },
            { key: "actions", header: "عملیات", render: (session) => (
              <ConfirmButton endpoint={`/api/admin/sessions/${session.id}`} method="DELETE" label="ابطال" confirmText="این نشست باطل شود؟ کاربر باید دوباره وارد شود." size="sm" />
            ) },
          ]}
        />
        <AdminPagination page={page} pageCount={sessions.pageCount} pathname="/admin/security" />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">رویدادهای حساس اخیر</h2>
        <AdminDataTable
          rows={events}
          rowKey={(event) => event.id}
          emptyText="رویداد حساسی ثبت نشده است."
          columns={[
            { key: "createdAt", header: "زمان", render: (event) => <span className="text-[11px]">{formatJalali(event.createdAt, true)}</span> },
            { key: "action", header: "اقدام", ltr: true, render: (event) => <span className="text-[11px]">{event.action}</span> },
            { key: "entity", header: "موجودیت", render: (event) => <span className="text-[11px]">{event.entity}</span> },
            { key: "actorPhone", header: "کاربر", ltr: true, render: (event) => <span className="text-[11px]">{event.actorPhone ?? "سیستم"}</span> },
            { key: "requestId", header: "شناسه درخواست", ltr: true, render: (event) => <span className="text-[10px] text-ink/40">{event.requestId ?? "—"}</span> },
            { key: "severity", header: "شدت", render: (event) => <span className={`rounded-full px-2 py-0.5 text-[10px] ${event.severity === "critical" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-700"}`}>{event.severity}</span> },
          ]}
        />
      </section>
    </div>
  );
}
