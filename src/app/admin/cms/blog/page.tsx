import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listBlogPosts } from "@/services/cms";
import { AdminCrudManager } from "@/components/admin/admin-crud";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { cmsStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "وبلاگ" };
export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  await requirePagePermission("cms.manage");
  const posts = await listBlogPosts();
  return (
    <div>
      <AdminPageHeader title="وبلاگ" description="نوشته‌های محتوایی فروشگاه با وضعیت انتشار، زمان‌بندی و SEO." />
      <AdminCrudManager
        title="همه نوشته‌ها"
        endpoint="/api/admin/cms/blog"
        createLabel="نوشته جدید"
        wide
        items={posts.map((post) => ({
          id: post.id, title: post.title, slug: post.slug, status: post.status,
          publishedAt: post.publishedAt?.toISOString() ?? null, updatedAt: post.updatedAt.toISOString(),
          excerpt: post.excerpt, content: post.content, coverImage: post.coverImage,
          scheduledAt: post.scheduledAt?.toISOString() ?? null, readingMinutes: post.readingMinutes,
          tags: post.tags, metaTitle: post.metaTitle, metaDescription: post.metaDescription,
        }))}
        columns={[
          { key: "title", label: "عنوان" },
          { key: "slug", label: "اسلاگ", type: "code" },
          { key: "status", label: "وضعیت", labelMap: cmsStatusLabels },
          { key: "publishedAt", label: "انتشار", type: "date" },
          { key: "readingMinutes", label: "زمان مطالعه", type: "number" },
        ]}
        fields={[
          { key: "title", label: "عنوان", type: "text", required: true },
          { key: "slug", label: "اسلاگ", type: "text", required: true, ltr: true },
          { key: "status", label: "وضعیت", type: "select", options: Object.entries(cmsStatusLabels).map(([value, label]) => ({ value, label })) },
          { key: "scheduledAt", label: "زمان انتشار", type: "datetime" },
          { key: "excerpt", label: "خلاصه", type: "textarea", rows: 2 },
          { key: "content", label: "محتوا", type: "textarea", rows: 10, required: true },
          { key: "coverImage", label: "تصویر کاور", type: "url", ltr: true },
          { key: "tags", label: "برچسب‌ها", type: "text", hint: "با ویرگول جدا کنید" },
          { key: "readingMinutes", label: "زمان مطالعه (دقیقه)", type: "number" },
          { key: "metaTitle", label: "عنوان SEO", type: "text" },
          { key: "metaDescription", label: "توضیح SEO", type: "textarea", rows: 2 },
        ]}
      />
    </div>
  );
}
