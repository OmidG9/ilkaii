import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listSubscribers } from "@/services/marketing";
import { AdminCrudManager } from "@/components/admin/admin-crud";
import { AdminFilters, AdminPageHeader, AdminSearch } from "@/components/admin/admin-widgets";
import { subscriberStatusLabels } from "@/lib/labels";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "خبرنامه" };
export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("marketing.manage");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const subscribers = await listSubscribers(q || undefined);
  return (
    <div>
      <AdminPageHeader title="مشترکان خبرنامه" description="وضعیت رضایت و اشتراک ایمیل/پیامک. لغو عضویت باید فوراً اعمال شود." />
      <AdminFilters resetHref="/admin/marketing/subscribers"><AdminSearch defaultValue={q} placeholder="ایمیل یا موبایل…" /></AdminFilters>
      <AdminCrudManager
        title="فهرست مشترکان"
        endpoint="/api/admin/marketing/subscribers"
        createLabel="مشترک جدید"
        items={subscribers.map((subscriber) => ({
          id: subscriber.id, email: subscriber.email, phone: subscriber.phone,
          status: subscriber.status, source: subscriber.source, createdAt: subscriber.createdAt.toISOString(),
        }))}
        columns={[
          { key: "email", label: "ایمیل", type: "code" },
          { key: "phone", label: "موبایل", type: "code" },
          { key: "status", label: "وضعیت", labelMap: subscriberStatusLabels },
          { key: "source", label: "منبع" },
          { key: "createdAt", label: "تاریخ", type: "date" },
        ]}
        fields={[
          { key: "email", label: "ایمیل", type: "text", ltr: true },
          { key: "phone", label: "موبایل", type: "text", ltr: true },
          { key: "status", label: "وضعیت", type: "select", options: Object.entries(subscriberStatusLabels).map(([value, label]) => ({ value, label })) },
          { key: "source", label: "منبع", type: "text" },
        ]}
      />
      <p className="mt-3 text-[10px] text-ink/35">ویرایش از طریق فرم، تنها وضعیت را تغییر می‌دهد؛ ایمیل و موبایل برای جلوگیری از تغییر هویت مشترک قابل ویرایش نیستند.</p>
    </div>
  );
}
