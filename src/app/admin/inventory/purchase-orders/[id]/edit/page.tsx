import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { PurchaseOrderForm, type PurchaseVariantOption } from "@/components/admin/purchase-order-form";
import { prisma } from "@/lib/db";
import { toToman } from "@/lib/money";
import { getPurchaseOrder, listSuppliers } from "@/services/warehouse";

export const metadata: Metadata = { title: "ویرایش سفارش خرید — مدیریت انبار" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditPurchaseOrderPage({ params }: Props) {
  await requirePagePermission("inventory.manage");
  const { id } = await params;
  let order;
  try {
    order = await getPurchaseOrder(id);
  } catch {
    notFound();
  }
  if (order.status !== "DRAFT") redirect(`/admin/inventory/purchase-orders/${id}`);

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
        title={`ویرایش پیش‌نویس ${order.number}`}
        description="فقط سفارش‌های پیش‌نویس قابل ویرایش‌اند. پس از ثبت برای تأمین‌کننده، اقلام قفل می‌شوند."
      />
      <WarehouseTabs />
      <PurchaseOrderForm
        suppliers={suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))}
        variants={options}
        order={{
          id: order.id,
          supplierId: order.supplierId,
          expectedAt: order.expectedAt ? order.expectedAt.toISOString() : null,
          shippingCost: order.shippingCost,
          discountAmount: order.discountAmount,
          note: order.note,
          items: order.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            note: item.note,
          })),
        }}
      />
    </div>
  );
}
