import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listMenus } from "@/services/cms";
import { MenuManager } from "@/components/admin/menu-manager";
import { AdminPageHeader } from "@/components/admin/admin-widgets";

export const metadata: Metadata = { title: "منوها" };
export const dynamic = "force-dynamic";

export default async function AdminMenusPage() {
  await requirePagePermission("cms.manage");
  const menus = await listMenus();
  return (
    <div>
      <AdminPageHeader title="مدیریت منوها" description="منوی سربرگ، موبایل و پایین صفحه با آیتم‌های تودرتو، لینک خارجی و ترتیب دلخواه." />
      <MenuManager menus={menus.map((menu) => ({
        id: menu.id,
        location: menu.location,
        name: menu.name,
        items: menu.items.map((item) => ({
          id: item.id, parentId: item.parentId, label: item.label, href: item.href,
          target: item.target, displayOrder: item.displayOrder, isActive: item.isActive,
        })),
      }))} />
    </div>
  );
}
