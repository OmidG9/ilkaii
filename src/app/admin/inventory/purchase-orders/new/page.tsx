import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { PurchaseOrderForm, type PurchaseVariantOption } from "@/components/admin/purchase-order-form";
import { prisma } from "@/lib/db";
import { toToman } from "@/lib/money";
import { listSuppliers } from "@/services/warehouse";

export const metadata: Metadata = { title: "سفارش خرید جدید — مدیریت انبار" };
export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage() {
  await requirePagePermission("inventory.manage");
  const [suppliers, variants] = await Promise.all([
    listSuppliers(),
    prisma.productVariant.findMany({
      where: { product: { isDeleted: false } },
      orderBy: [{ product: { name: "asc" } }, { size: "asc" }],
      take: 1000,
      select: {
        id: true, sku: true, size: true, color: true, stock: true, costPrice: true, supplierId: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  const options: PurchaseVariantOption[] = variants.map((variant) => ({
    id: variant.id,
    label: `${variant.product.name} — ${variant.size}${variant.color ? ` / ${variant.color}` : ""} (${variant.sku})`,
    sku: variant.sku,
    costPrice: variant.costPrice ? toToman(variant.costPrice) : null,
    supplierId: variant.supplierId,
    stock: variant.stock,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="سفارش خرید جدید"
        description="سفارش به‌صورت پیش‌نویس ثبت می‌شود. پس از بازبینی، آن را برای تأمین‌کننده ثبت کنید و هنگام ورود کالا رسید انبار بزنید."
      />
      <WarehouseTabs />
      {!suppliers.length ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          ابتدا یک تأمین‌کننده فعال در بخش «تأمین‌کنندگان» ایجاد کنید.
        </div>
      ) : (
        <PurchaseOrderForm
          suppliers={suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))}
          variants={options}
        />
      )}
    </div>
  );
}
