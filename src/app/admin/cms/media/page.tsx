import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listMediaAssets, storageUsage } from "@/services/cms";
import { MediaManager } from "@/components/admin/media-manager";
import { AdminFilters, AdminPageHeader, AdminSearch } from "@/components/admin/admin-widgets";
import { formatNumber } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "کتابخانه رسانه" };
export const dynamic = "force-dynamic";

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("cms.manage");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const type = typeof params.type === "string" ? params.type : "";
  const [assets, usage] = await Promise.all([listMediaAssets(q || undefined, type || undefined), storageUsage()]);
  return (
    <div>
      <AdminPageHeader
        title="کتابخانه رسانه"
        description={`${formatNumber(usage.files)} فایل — ${formatNumber(Math.round(usage.bytes / 1024))} کیلوبایت. حذف فایلی که در محصول یا محتوا استفاده شده باشد مسدود است.`}
      />
      <AdminFilters resetHref="/admin/cms/media">
        <AdminSearch defaultValue={q} placeholder="جستجو در آدرس یا alt…" />
        <select name="type" defaultValue={type} className="field max-w-44" aria-label="نوع فایل">
          <option value="">همه انواع</option>
          <option value="image">تصویر</option>
          <option value="video">ویدئو</option>
          <option value="application">سند</option>
        </select>
      </AdminFilters>
      <MediaManager assets={assets.map((asset) => ({
        id: asset.id, url: asset.url, altText: asset.altText, mimeType: asset.mimeType,
        size: asset.size, width: asset.width, height: asset.height, folder: asset.folder,
        createdAt: asset.createdAt.toISOString(),
      }))} />
    </div>
  );
}
