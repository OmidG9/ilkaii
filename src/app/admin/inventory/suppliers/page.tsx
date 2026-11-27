import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { EntityManager, type EntityField } from "@/components/admin/entity-manager";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { listSuppliers } from "@/services/warehouse";

export const metadata: Metadata = { title: "تأمین‌کنندگان — مدیریت انبار" };
export const dynamic = "force-dynamic";

export default async function AdminSuppliersPage() {
  await requirePagePermission("inventory.manage");
  const suppliers = await listSuppliers({ includeInactive: true });

  const fields: EntityField[] = [
    { key: "name", label: "نام تأمین‌کننده", type: "text", required: true },
    { key: "contactName", label: "نام شخص رابط", type: "text" },
    { key: "phone", label: "تلفن", type: "text" },
    { key: "email", label: "ایمیل", type: "text", placeholder: "optional@example.com" },
    { key: "leadTimeDays", label: "زمان تحویل (روز)", type: "number", placeholder: "مثلاً ۱۴" },
    { key: "address", label: "آدرس", type: "textarea" },
    { key: "notes", label: "یادداشت", type: "textarea" },
    { key: "isActive", label: "فعال", type: "checkbox" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="تأمین‌کنندگان"
        description="تأمین‌کننده پیش‌فرض هر تنوع را اینجا تعریف کنید؛ زمان تحویل در پیشنهاد خرید مجدد استفاده می‌شود."
      />
      <WarehouseTabs />
      <EntityManager
        endpoint="/api/admin/suppliers"
        fields={fields}
        columns={[
          { key: "name", label: "نام" },
          { key: "contactName", label: "رابط" },
          { key: "phone", label: "تلفن", ltr: true },
          { key: "leadTimeDays", label: "زمان تحویل (روز)" },
          { key: "variants", label: "تنوع‌های وابسته" },
          { key: "orders", label: "سفارش‌های خرید" },
          { key: "openOrders", label: "سفارش باز" },
          { key: "isActive", label: "فعال" },
        ]}
        items={suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.name,
          contactName: supplier.contactName,
          phone: supplier.phone,
          email: supplier.email,
          leadTimeDays: supplier.leadTimeDays,
          address: supplier.address,
          notes: supplier.notes,
          isActive: supplier.isActive,
          variants: supplier._count.variants,
          orders: supplier._count.purchaseOrders,
          openOrders: supplier.purchaseOrders.length,
        }))}
        createLabel="افزودن تأمین‌کننده"
      />
      <p className="text-[10px] leading-5 text-ink/35">
        حذف تأمین‌کننده‌ای که سفارش خرید دارد مجاز نیست؛ برای حفظ سابقه، آن را غیرفعال کنید. حذف تأمین‌کننده بدون سفارش، ارتباط پیش‌فرض تنوع‌ها را قطع می‌کند.
      </p>
    </div>
  );
}
