import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { getAnalyticsSession } from "@/services/analytics";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { analyticsEventLabels } from "@/lib/labels";
import { formatJalali, formatNumber, formatSeconds } from "@/lib/persian";

export const metadata: Metadata = { title: "جزئیات نشست" };
export const dynamic = "force-dynamic";

export default async function AnalyticsSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("analytics.view");
  const { id } = await params;
  const session = await getAnalyticsSession(id);
  if (!session) notFound();
  const duration = Math.max(0, Math.round((session.lastSeenAt.getTime() - session.firstSeenAt.getTime()) / 1000));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="جزئیات نشست"
        description="خط زمانی رویدادهای مجاز این نشست. اطلاعات هویتی فقط در صورت ورود مشتری و بر اساس دسترسی نقش نمایش داده می‌شود."
        actions={<Link href="/admin/analytics/sessions" className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary">بازگشت به نشست‌ها</Link>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="مدت نشست" value={formatSeconds(duration)} />
        <AdminStatCard label="بازدید صفحه" value={formatNumber(session.pageViews)} />
        <AdminStatCard label="رویدادها" value={formatNumber(session.eventCount)} />
        <AdminStatCard label="دستگاه" value={session.device ?? "—"} hint={session.browser ?? undefined} />
      </div>

      <section className="admin-panel p-5">
        <h2 className="mb-3 text-sm font-semibold">اطلاعات نشست</h2>
        <dl className="grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-ink/40">شناسه ناشناس</dt><dd dir="ltr" className="mt-1 text-[10px]">{session.id}</dd></div>
          <div><dt className="text-ink/40">شروع</dt><dd className="mt-1">{formatJalali(session.firstSeenAt, true)}</dd></div>
          <div><dt className="text-ink/40">آخرین فعالیت</dt><dd className="mt-1">{formatJalali(session.lastSeenAt, true)}</dd></div>
          <div><dt className="text-ink/40">صفحه ورود</dt><dd dir="ltr" className="mt-1 text-[10px]">{session.entryPath ?? "—"}</dd></div>
          <div><dt className="text-ink/40">صفحه خروج</dt><dd dir="ltr" className="mt-1 text-[10px]">{session.exitPath ?? "—"}</dd></div>
          <div><dt className="text-ink/40">منبع</dt><dd className="mt-1">{session.utmSource ?? "direct"} / {session.utmMedium ?? "—"} / {session.utmCampaign ?? "—"}</dd></div>
          <div><dt className="text-ink/40">مشتری</dt><dd dir="ltr" className="mt-1">{session.customer?.phone ?? "مهمان"}</dd></div>
          <div><dt className="text-ink/40">Referrer</dt><dd dir="ltr" className="mt-1 truncate text-[10px]">{session.referrer ?? "—"}</dd></div>
          <div><dt className="text-ink/40">پرش</dt><dd className="mt-1">{session.isBounced ? "بله" : "خیر"}</dd></div>
        </dl>
      </section>

      <section className="admin-panel p-5">
        <h2 className="mb-4 text-sm font-semibold">خط زمانی</h2>
        <ol className="relative space-y-4 border-r border-line pe-4">
          {session.events.map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -right-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium">{analyticsEventLabels[event.name] ?? event.name}</span>
                <span className="text-[10px] text-ink/40">{formatJalali(event.createdAt, true)}</span>
                {event.productId ? <span dir="ltr" className="admin-chip text-[9px]">product:{event.productId.slice(0, 8)}</span> : null}
                {event.variantId ? <span dir="ltr" className="admin-chip text-[9px]">variant:{event.variantId.slice(0, 8)}</span> : null}
              </div>
              <p dir="ltr" className="mt-1 truncate text-[10px] text-ink/45">{event.path}</p>
              {event.metadata ? <pre dir="ltr" className="mt-1 max-h-28 overflow-auto rounded-lg bg-canvas p-2 text-[9px] text-ink/50">{JSON.stringify(event.metadata)}</pre> : null}
            </li>
          ))}
          {!session.events.length ? <li className="text-xs text-ink/45">رویدادی ثبت نشده است.</li> : null}
        </ol>
      </section>
    </div>
  );
}
