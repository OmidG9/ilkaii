import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { listMenus } from "@/services/cms";
import { MenuManager } from "@/components/admin/menu-manager";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { Alert } from "@/components/ui/display";

export const metadata: Metadata = { title: "پایین صفحه" };
export const dynamic = "force-dynamic";

export default async function AdminFooterPage() {
  await requirePagePermission("cms.manage");
  const menus = await listMenus();
  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="محتوای پایین صفحه"
        description="منوی پایین صفحه را مدیریت کنید. اطلاعات تماس، نام برند و متن‌های حقوقی از تنظیمات سایت خوانده می‌شوند."
        actions={<Link href="/admin/settings" className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary">تنظیمات برند و تماس</Link>}
      />
      <Alert tone="info">لینک‌های ثابت فروشگاه (درباره ما، تماس، سیاست‌ها، پیگیری سفارش) به‌صورت پیش‌فرض نمایش داده می‌شوند؛ آیتم‌های این منو در کنار آن‌ها قرار می‌گیرند.</Alert>
      <MenuManager menus={menus.map((menu) => ({
        id: menu.id, location: menu.location, name: menu.name,
        items: menu.items.map((item) => ({
          id: item.id, parentId: item.parentId, label: item.label, href: item.href,
          target: item.target, displayOrder: item.displayOrder, isActive: item.isActive,
        })),
      }))} />
    </div>
  );
}
