import type { Metadata } from "next";
import { getSettings } from "@/services/admin";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "تنظیمات سایت — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { config, overrides } = await getSettings();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-semibold">تنظیمات سایت</h1>
        <p className="text-sm text-ink/60">
          این تنظیمات بدون نیاز به ساخت مجدد اعمال میشوند و برای سفارشیسازی برند (white-label) استفاده میگردند.
        </p>
      </div>
      <SettingsForm config={config} overrides={overrides} />
    </div>
  );
}
