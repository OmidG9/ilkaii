import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { StocktakeCreateForm } from "@/components/admin/stocktake-manager";
import { Card } from "@/components/ui/display";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "انبارگردانی جدید — مدیریت انبار" };
export const dynamic = "force-dynamic";

export default async function NewStocktakePage() {
  await requirePagePermission("inventory.manage");
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="انبارگردانی جدید"
        description="در زمان شروع، موجودی سیستم همه تنوع‌های دامنه انتخاب‌شده ثبت می‌شود. سپس شمارش فیزیکی را وارد و در پایان تأیید کنید."
      />
      <WarehouseTabs />
      <Card className="p-5">
        <StocktakeCreateForm categories={categories} />
      </Card>
      <div className="admin-panel p-5 text-xs leading-6 text-ink/55">
        <p className="font-medium text-ink/75">نکته‌های عملیاتی</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>برای شمارش سریع‌تر، دامنه را به یک دسته‌بندی یا فقط کالاهای کم‌موجود محدود کنید.</li>
          <li>هر تنوع فقط یک بار در هر انبارگردانی ثبت می‌شود و شمارش‌ها تا تأیید نهایی موجودی را تغییر نمی‌دهند.</li>
          <li>در زمان تأیید، مغایرت به‌صورت «شمارش منهای موجودی سیستم» اعمال می‌شود؛ فروش‌های هم‌زمان حفظ می‌شوند.</li>
        </ul>
      </div>
    </div>
  );
}
