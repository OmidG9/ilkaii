import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { storageUsage } from "@/services/cms";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { FileText, Images, LayoutTemplate, Newspaper, Image as ImageIcon, Navigation, PanelBottom } from "lucide-react";
import { formatNumber } from "@/lib/persian";

export const metadata: Metadata = { title: "مدیریت محتوا" };
export const dynamic = "force-dynamic";

export default async function AdminCmsPage() {
  await requirePagePermission("cms.manage");
  const [pages, publishedPages, posts, banners, sections, menus, media] = await Promise.all([
    prisma.cmsPage.count(),
    prisma.cmsPage.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count(),
    prisma.banner.count({ where: { isActive: true } }),
    prisma.homepageSection.count({ where: { isEnabled: true } }),
    prisma.menu.count(),
    storageUsage(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="مدیریت محتوا" description="صفحه اصلی، صفحات، بنرها، منوها، رسانه و وبلاگ را بدون تغییر کد مدیریت کنید." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="صفحات" value={formatNumber(pages)} hint={`منتشرشده: ${formatNumber(publishedPages)}`} icon={<FileText className="h-5 w-5" />} href="/admin/cms/pages" />
        <AdminStatCard label="نوشته‌های وبلاگ" value={formatNumber(posts)} icon={<Newspaper className="h-5 w-5" />} href="/admin/cms/blog" />
        <AdminStatCard label="بنرهای فعال" value={formatNumber(banners)} icon={<ImageIcon className="h-5 w-5" />} href="/admin/cms/banners" />
        <AdminStatCard label="بخش‌های صفحه اصلی" value={formatNumber(sections)} icon={<LayoutTemplate className="h-5 w-5" />} href="/admin/cms/homepage" />
        <AdminStatCard label="منوها" value={formatNumber(menus)} icon={<Navigation className="h-5 w-5" />} href="/admin/cms/menus" />
        <AdminStatCard label="فایل‌های رسانه" value={formatNumber(media.files)} hint={`${formatNumber(Math.round(media.bytes / 1024))} کیلوبایت`} icon={<Images className="h-5 w-5" />} href="/admin/cms/media" />
        <AdminStatCard label="منوی پایین" value="مدیریت" icon={<PanelBottom className="h-5 w-5" />} href="/admin/cms/footer" />
      </div>

      <section className="admin-panel p-5">
        <h2 className="mb-3 text-sm font-semibold">میان‌برهای محتوا</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/admin/cms/pages", label: "ایجاد و ویرایش صفحات" },
            { href: "/admin/cms/homepage", label: "ساخت صفحه اصلی" },
            { href: "/admin/cms/banners", label: "مدیریت بنرها" },
            { href: "/admin/cms/menus", label: "منوهای سربرگ و موبایل" },
            { href: "/admin/cms/media", label: "کتابخانه رسانه" },
            { href: "/admin/cms/blog", label: "وبلاگ" },
            { href: "/admin/cms/footer", label: "محتوای پایین صفحه" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl border border-line px-4 py-3 text-sm transition-colors hover:border-primary hover:bg-primary/5">{item.label}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
