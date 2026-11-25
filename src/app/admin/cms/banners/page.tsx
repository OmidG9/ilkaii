import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listBanners } from "@/services/cms";
import { AdminCrudManager } from "@/components/admin/admin-crud";
import { AdminPageHeader } from "@/components/admin/admin-widgets";

export const metadata: Metadata = { title: "بنرها" };
export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  await requirePagePermission("cms.manage");
  const banners = await listBanners();
  return (
    <div>
      <AdminPageHeader title="بنرها" description="بنرهای صفحه اصلی و جایگاه‌های تبلیغاتی با زمان‌بندی و ترتیب دلخواه." />
      <AdminCrudManager
        title="همه بنرها"
        endpoint="/api/admin/cms/banners"
        createLabel="بنر جدید"
        items={banners.map((banner) => ({
          id: banner.id, title: banner.title, placement: banner.placement, isActive: banner.isActive,
          displayOrder: banner.displayOrder, startsAt: banner.startsAt?.toISOString() ?? null,
          endsAt: banner.endsAt?.toISOString() ?? null, image: banner.image,
          subtitle: banner.subtitle, mobileImage: banner.mobileImage, href: banner.href,
        }))}
        columns={[
          { key: "title", label: "عنوان" },
          { key: "placement", label: "جایگاه" },
          { key: "displayOrder", label: "ترتیب", type: "number" },
          { key: "isActive", label: "فعال", type: "boolean" },
          { key: "startsAt", label: "شروع", type: "date" },
          { key: "endsAt", label: "پایان", type: "date" },
        ]}
        fields={[
          { key: "title", label: "عنوان", type: "text", required: true },
          { key: "subtitle", label: "زیرعنوان", type: "text" },
          { key: "image", label: "آدرس تصویر", type: "url", required: true, ltr: true, hint: "از کتابخانه رسانه کپی کنید" },
          { key: "mobileImage", label: "تصویر موبایل", type: "url", ltr: true },
          { key: "href", label: "لینک", type: "text", ltr: true },
          { key: "placement", label: "جایگاه", type: "select", options: [{ value: "HOME", label: "صفحه اصلی" }, { value: "SHOP", label: "فروشگاه" }, { value: "SIDEBAR", label: "ستون کنار" }] },
          { key: "displayOrder", label: "ترتیب", type: "number" },
          { key: "isActive", label: "فعال", type: "checkbox" },
          { key: "startsAt", label: "شروع نمایش", type: "datetime" },
          { key: "endsAt", label: "پایان نمایش", type: "datetime" },
        ]}
      />
    </div>
  );
}
