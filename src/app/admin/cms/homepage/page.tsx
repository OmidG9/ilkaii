import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listHomepageSections } from "@/services/cms";
import { HomepageBuilder } from "@/components/admin/homepage-builder";
import { AdminPageHeader } from "@/components/admin/admin-widgets";

export const metadata: Metadata = { title: "صفحه اصلی" };
export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  await requirePagePermission("cms.manage");
  const sections = await listHomepageSections();
  return (
    <div>
      <AdminPageHeader
        title="سازنده صفحه اصلی"
        description="بخش‌ها را اضافه، حذف، مرتب و زمان‌بندی کنید. اگر هیچ بخش فعالی وجود نداشته باشد، طرح پیش‌فرض فروشگاه نمایش داده می‌شود."
      />
      <HomepageBuilder sections={sections.map((section) => ({
        id: section.id, type: section.type, title: section.title, subtitle: section.subtitle,
        config: section.config, displayOrder: section.displayOrder, isEnabled: section.isEnabled,
        startsAt: section.startsAt?.toISOString() ?? null,
        endsAt: section.endsAt?.toISOString() ?? null,
        updatedAt: section.updatedAt.toISOString(),
      }))} />
    </div>
  );
}
