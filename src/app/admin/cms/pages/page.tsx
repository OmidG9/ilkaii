import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listCmsPages } from "@/services/cms";
import { AdminCrudManager } from "@/components/admin/admin-crud";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { cmsStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "صفحات محتوا" };
export const dynamic = "force-dynamic";

export default async function AdminCmsPagesPage() {
  await requirePagePermission("cms.manage");
  const pages = await listCmsPages();
  const items = pages.map((page) => ({
    id: page.id, title: page.title, slug: page.slug, status: page.status,
    publishedAt: page.publishedAt?.toISOString() ?? null,
    scheduledAt: page.scheduledAt?.toISOString() ?? null,
    updatedAt: page.updatedAt.toISOString(),
    excerpt: page.excerpt, content: page.content, metaTitle: page.metaTitle,
    metaDescription: page.metaDescription, ogImage: page.ogImage,
  }));

  return (
    <div>
      <AdminPageHeader title="صفحات" description="صفحات محتوایی با پیش‌نویس، انتشار زمان‌بندی‌شده، اسلاگ یکتا و متادیتای SEO. محتوا به‌صورت متن امن ذخیره می‌شود." />
      <AdminCrudManager
        title="همه صفحات"
        endpoint="/api/admin/cms/pages"
        createLabel="صفحه جدید"
        wide
        items={items}
        columns={[
          { key: "title", label: "عنوان" },
          { key: "slug", label: "اسلاگ", type: "code" },
          { key: "status", label: "وضعیت", labelMap: cmsStatusLabels },
          { key: "publishedAt", label: "انتشار", type: "date" },
          { key: "updatedAt", label: "آخرین ویرایش", type: "date" },
        ]}
        fields={[
          { key: "title", label: "عنوان صفحه", type: "text", required: true },
          { key: "slug", label: "اسلاگ", type: "text", required: true, ltr: true, hint: "فقط حروف کوچک انگلیسی، عدد و خط تیره" },
          { key: "status", label: "وضعیت", type: "select", options: Object.entries(cmsStatusLabels).map(([value, label]) => ({ value, label })) },
          { key: "scheduledAt", label: "زمان انتشار", type: "datetime", hint: "برای وضعیت زمان‌بندی‌شده الزامی است" },
          { key: "excerpt", label: "خلاصه", type: "textarea", rows: 2 },
          { key: "content", label: "محتوا", type: "textarea", rows: 10, required: true },
          { key: "metaTitle", label: "عنوان SEO", type: "text" },
          { key: "metaDescription", label: "توضیح SEO", type: "textarea", rows: 2 },
          { key: "ogImage", label: "تصویر Open Graph", type: "url", ltr: true },
        ]}
      />
    </div>
  );
}
