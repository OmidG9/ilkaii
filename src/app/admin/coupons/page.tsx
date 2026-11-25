import type { Metadata } from "next";
import { listCoupons } from "@/services/admin";
import { EntityManager, toEntityRows, type EntityField } from "@/components/admin/entity-manager";
import { formatToman } from "@/lib/money";
import { formatNumber } from "@/lib/persian";

export const metadata: Metadata = { title: "کدهای تخفیف — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();
  const rows = toEntityRows(coupons).map((coupon) => ({
    ...coupon,
    valueLabel: coupon.type === "PERCENTAGE" ? `${formatNumber(Number(coupon.value))}٪` : formatToman(Number(coupon.value)),
  }));
  const fields: EntityField[] = [
    { key: "code", label: "کد", type: "text", required: true, placeholder: "ILKAII10" },
    { key: "type", label: "نوع تخفیف", type: "select", required: true, options: [
      { value: "PERCENTAGE", label: "درصدی" },
      { value: "FIXED", label: "مبلغ ثابت (تومان)" },
    ] },
    { key: "value", label: "مقدار", type: "number", required: true },
    { key: "minPurchase", label: "حداقل خرید (تومان)", type: "number" },
    { key: "maxDiscount", label: "سقف تخفیف (تومان)", type: "number" },
    { key: "usageLimit", label: "حد کل استفاده", type: "number" },
    { key: "perUserLimit", label: "حد استفاده هر کاربر", type: "number" },
    { key: "startsAt", label: "شروع", type: "datetime" },
    { key: "expiresAt", label: "پایان", type: "datetime" },
    { key: "isActive", label: "فعال", type: "checkbox" },
  ];
  return (
    <div>
      <h1 className="mb-2 text-3xl font-semibold">کدهای تخفیف</h1>
      <p className="mb-8 text-sm text-ink/60">کدها در تسویه حساب توسط سرور اعتبارسنجی میشوند.</p>
      <EntityManager
        endpoint="/api/admin/coupons"
        fields={fields}
        columns={[
          { key: "code", label: "کد", ltr: true },
          { key: "type", label: "نوع" },
          { key: "valueLabel", label: "مقدار", ltr: true },
          { key: "usedCount", label: "استفاده" },
          { key: "isActive", label: "وضعیت" },
        ]}
        items={rows}
        createLabel="افزودن کد تخفیف"
      />
    </div>
  );
}
