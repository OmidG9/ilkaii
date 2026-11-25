import type { Metadata } from "next";
import { listCustomers } from "@/services/admin";
import { requirePageAdmin } from "@/lib/auth/session";
import { EntityManager, toEntityRows, type EntityField } from "@/components/admin/entity-manager";
import { Card, Pagination } from "@/components/ui/display";
import { formatNumber } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "مشتریان — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const actor = await requirePageAdmin();
  const result = await listCustomers({ page, pageSize: 12, q: q || undefined });
  const activeField: EntityField = { key: "isActive", label: "فعال", type: "checkbox" };
  const roleField: EntityField = {
    key: "role", label: "نقش", type: "select", options: [
      { value: "CUSTOMER", label: "مشتری" },
      { value: "PRODUCT_MANAGER", label: "مدیر محصول" },
      { value: "ORDER_MANAGER", label: "مدیر سفارشها" },
      { value: "ADMIN", label: "مدیر" },
      { value: "SUPER_ADMIN", label: "مدیرکل" },
    ],
  };
  // Only the super admin may change roles; other admins can still suspend accounts.
  const fields: EntityField[] = actor.role === "SUPER_ADMIN" ? [roleField, activeField] : [activeField];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-semibold">مشتریان</h1>
        <p className="text-sm text-ink/60">برای تغییر نقش، آیتم مربوطه را ویرایش کنید. اعطای نقش مدیر تنها توسط مدیرکل مجاز است.</p>
      </div>

      <Card className="p-5">
        <form method="get" className="flex flex-wrap gap-3">
          <input name="q" defaultValue={q} placeholder="جستجو بر اساس نام یا موبایل" className="field max-w-sm flex-1" dir="ltr" />
          <button className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-sm text-white" type="submit">جستجو</button>
        </form>
      </Card>

      <EntityManager
        endpoint="/api/admin/customers"
        fields={fields}
        columns={[
          { key: "phone", label: "موبایل", ltr: true },
          { key: "firstName", label: "نام" },
          { key: "role", label: "نقش" },
          { key: "_count.orders", label: "سفارشها" },
          { key: "spent", label: "خرید (تومان)", ltr: true },
          { key: "isActive", label: "فعال" },
        ]}
        items={toEntityRows(result.items)}
        canCreate={false}
        canDelete={false}
        createLabel="ویرایش"
      />
      <Pagination page={page} pageCount={result.pageCount} pathname="/admin/customers" params={{ q: q || undefined }} />
      <p className="text-xs text-ink/45">تعداد کل: {formatNumber(result.total)} — جزئیات مشتری از طریق سفارشها قابل مشاهده است.</p>
    </div>
  );
}
