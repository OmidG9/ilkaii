import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listReturns } from "@/services/admin";
import { EntityManager, type EntityField } from "@/components/admin/entity-manager";
import { formatToman, toToman } from "@/lib/money";
import { formatJalali } from "@/lib/persian";
import { returnStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "بازگشتها — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminReturnsPage() {
  await requirePagePermission("orders.view");
  const returns = await listReturns();
  const rows = returns.map((item) => ({
    id: item.id,
    status: item.status,
    note: item.note,
    reason: item.reason,
    orderNumber: item.order.orderNumber,
    customer: [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.phone || "—",
    amount: formatToman(toToman(item.order.totalAmount)),
    createdAtLabel: formatJalali(item.createdAt.toISOString()),
  })) as unknown as Array<Record<string, unknown>>;
  const fields: EntityField[] = [
    { key: "status", label: "وضعیت", type: "select", required: true, options: [
      { value: "PENDING", label: "در انتظار بررسی" },
      { value: "APPROVED", label: "تأیید شده" },
      { value: "REJECTED", label: "رد شده" },
      { value: "COMPLETED", label: "تکمیل شده" },
    ] },
    { key: "note", label: "پاسخ به مشتری", type: "textarea" },
  ];
  return (
    <div>
      <h1 className="mb-2 text-3xl font-semibold">درخواستهای بازگشت</h1>
      <p className="mb-8 text-sm text-ink/60">درخواستها را بررسی و نتیجه را ثبت کنید. پاسخ در حساب مشتری نمایش داده میشود.</p>
      <EntityManager
        endpoint="/api/admin/returns"
        fields={fields}
        columns={[
          { key: "orderNumber", label: "سفارش", ltr: true },
          { key: "customer", label: "مشتری" },
          { key: "reason", label: "دلیل" },
          { key: "amount", label: "مبلغ سفارش", ltr: true },
          { key: "status", label: "وضعیت" },
          { key: "createdAtLabel", label: "تاریخ" },
        ]}
        items={rows}
        canCreate={false}
        canDelete={false}
        createLabel="ویرایش درخواست"
      />
      <p className="mt-4 text-xs text-ink/45">وضعیتها: {Object.values(returnStatusLabels).join("، ")}</p>
    </div>
  );
}
