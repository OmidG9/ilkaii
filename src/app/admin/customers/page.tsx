import type { Metadata } from "next";
import Link from "next/link";
import { requirePageAnyPermission, permissionKeysForRole } from "@/lib/auth/session";
import { CUSTOMER_SEGMENTS, listCustomers, type CustomerSegmentKey } from "@/services/crm";
import { AdminDataTable, AdminFilters, AdminPageHeader, AdminPagination, AdminSearch } from "@/components/admin/admin-widgets";
import { formatJalali, formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "مشتریان" };
export const dynamic = "force-dynamic";

const segmentLabels = Object.fromEntries(CUSTOMER_SEGMENTS.map((item) => [item.key, item.label])) as Record<string, string>;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const user = await requirePageAnyPermission("customers.view", "customer.read");
  const permissions = await permissionKeysForRole(user.role);
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const rawSegment = typeof params.segment === "string" ? params.segment : "";
  const segment = CUSTOMER_SEGMENTS.some((item) => item.key === rawSegment) ? rawSegment as CustomerSegmentKey : undefined;
  const numberParam = (key: string) => {
    const value = Number(params[key]);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };
  const sort = params.sort === "spend" || params.sort === "orders" || params.sort === "activity" ? params.sort : "newest";
  const activitySince = typeof params.activitySince === "string" && params.activitySince
    ? new Date(Date.now() - Number(params.activitySince) * 24 * 60 * 60 * 1000)
    : undefined;
  const result = await listCustomers({
    page, pageSize: 20, q: q || undefined, segment,
    minSpend: numberParam("minSpend"), minOrders: numberParam("minOrders"),
    activitySince, sort,
  });
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries({ q, segment: segment ?? "", minSpend: params.minSpend, minOrders: params.minOrders })) {
    if (typeof value === "string" && value) exportParams.set(key, value);
  }

  return (
    <div>
      <AdminPageHeader
        title="مشتریان"
        description="پروفایل، بخش‌بندی و تاریخچه خرید مشتریان. بخش‌ها از داده واقعی سفارش‌ها و سبد خرید محاسبه می‌شوند."
        actions={permissions.includes("customers.export") ? (
          <Link href={`/api/admin/customers/export?${exportParams.toString()}`} className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary" prefetch={false}>خروجی CSV</Link>
        ) : null}
      />
      <AdminFilters resetHref="/admin/customers">
        <AdminSearch defaultValue={q} placeholder="نام، موبایل یا ایمیل…" />
        <select name="segment" defaultValue={segment ?? ""} className="field max-w-44" aria-label="بخش مشتری">
          <option value="">همه بخش‌ها</option>
          {CUSTOMER_SEGMENTS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <input name="minSpend" type="number" min={0} defaultValue={params.minSpend as string | undefined} placeholder="حداقل خرید (تومان)" className="field max-w-40" dir="ltr" aria-label="حداقل خرید" />
        <input name="minOrders" type="number" min={0} defaultValue={params.minOrders as string | undefined} placeholder="حداقل سفارش" className="field max-w-32" dir="ltr" aria-label="حداقل سفارش" />
        <select name="activitySince" defaultValue={params.activitySince as string | undefined} className="field max-w-44" aria-label="آخرین فعالیت">
          <option value="">همه زمان‌ها</option>
          <option value="7">فعال در ۷ روز</option>
          <option value="30">فعال در ۳۰ روز</option>
          <option value="90">فعال در ۹۰ روز</option>
        </select>
        <select name="sort" defaultValue={sort} className="field max-w-40" aria-label="مرتب‌سازی">
          <option value="newest">جدیدترین</option>
          <option value="spend">بیشترین خرید</option>
          <option value="orders">بیشترین سفارش</option>
          <option value="activity">آخرین فعالیت</option>
        </select>
      </AdminFilters>

      <AdminDataTable
        rows={result.items}
        rowKey={(customer) => customer.id}
        emptyText="مشتری‌ای با این فیلترها یافت نشد."
        footer={<span>مجموع: {formatNumber(result.total)} مشتری — بخش‌ها: {Object.values(segmentLabels).join("، ")}</span>}
        columns={[
          { key: "name", header: "مشتری", render: (customer) => (
            <div>
              <Link href={`/admin/customers/${customer.id}`} className="text-xs font-medium text-primary hover:underline">{[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "بدون نام"}</Link>
              <p dir="ltr" className="mt-0.5 text-[10px] text-ink/45">{customer.phone}</p>
            </div>
          ) },
          { key: "segments", header: "بخش", render: (customer) => (
            <div className="flex max-w-44 flex-wrap gap-1">
              {customer.segments.length ? customer.segments.map((key) => <span key={key} className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] text-primary">{segmentLabels[key]}</span>) : <span className="text-[10px] text-ink/35">—</span>}
            </div>
          ) },
          { key: "orders", header: "سفارش", render: (customer) => <span className="text-[11px]">{formatNumber(customer.orders)} <span className="text-ink/35">/ پرداخت {formatNumber(customer.paidOrders)}</span></span> },
          { key: "spent", header: "خرید", ltr: true, render: (customer) => <span className="text-[11px]">{formatToman(customer.spent)}</span> },
          { key: "lastPurchase", header: "آخرین خرید", render: (customer) => <span className="text-[10px]">{customer.lastPurchase ? formatJalali(customer.lastPurchase) : "—"}</span> },
          { key: "lastActivity", header: "آخرین فعالیت", render: (customer) => <span className="text-[10px]">{customer.lastActivity ? formatJalali(customer.lastActivity) : "—"}</span> },
          { key: "createdAt", header: "عضویت", render: (customer) => <span className="text-[10px]">{formatJalali(customer.createdAt)}</span> },
          { key: "actions", header: "عملیات", render: (customer) => <Link href={`/admin/customers/${customer.id}`} className="text-[11px] text-primary hover:underline">پروفایل</Link> },
        ]}
      />
      <AdminPagination page={page} pageCount={result.pageCount} pathname="/admin/customers" params={{ q: q || undefined, segment: segment ?? undefined, minSpend: params.minSpend as string | undefined, minOrders: params.minOrders as string | undefined, activitySince: params.activitySince as string | undefined, sort }} />
    </div>
  );
}
