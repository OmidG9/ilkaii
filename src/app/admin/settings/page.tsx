import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { getSettings } from "@/services/admin";
import { prisma } from "@/lib/db";
import { listSecretMetadata } from "@/lib/secrets";
import { storageUsage } from "@/services/cms";
import { getAnalyticsSettings } from "@/services/analytics";
import { SettingsForm } from "@/components/admin/settings-form";
import { IntegrationSecrets } from "@/components/admin/integration-secrets";
import { SimpleSettingsForm } from "@/components/admin/simple-settings-form";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { Alert } from "@/components/ui/display";
import { formatNumber } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "تنظیمات" };
export const dynamic = "force-dynamic";

const tabs = [
  { key: "general", label: "عمومی و برند" },
  { key: "integrations", label: "یکپارچه‌سازی و رازها" },
  { key: "analytics", label: "تحلیل و حریم خصوصی" },
  { key: "operations", label: "عملیات و پشتیبان‌گیری" },
] as const;

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("settings.manage");
  const params = await searchParams;
  const tab = tabs.some((item) => item.key === params.tab) ? params.tab as string : "general";
  const [{ config, overrides }, secrets, media, analyticsSettings, rows] = await Promise.all([
    getSettings(),
    listSecretMetadata(),
    storageUsage(),
    getAnalyticsSettings(),
    prisma.siteSetting.findMany({ select: { key: true, value: true } }),
  ]);
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="تنظیمات سیستم"
        description="تنظیمات برند، یکپارچه‌سازی‌ها، تحلیل و عملیات. رازهای یکپارچه‌سازی فقط برای نقش دارای settings.manage و به‌صورت پوشانده‌شده نمایش داده می‌شوند."
      />
      <nav className="flex flex-wrap gap-1.5" aria-label="بخش تنظیمات">
        {tabs.map((item) => (
          <Link key={item.key} href={`/admin/settings?tab=${item.key}`} data-active={tab === item.key}
            className={`min-h-9 rounded-xl border px-4 text-xs ${tab === item.key ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink/60 hover:border-primary"}`}>
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "general" ? <SettingsForm config={config} overrides={overrides} /> : null}

      {tab === "integrations" ? (
        <div className="space-y-4">
          <Alert tone="info">در محیط تولید، سرویس‌های ناشناخته مسدود می‌شوند. رازها با AES-256-GCM رمزنگاری می‌شوند و هرگز در خروجی API یا گزارش اقدامات ثبت نمی‌شوند.</Alert>
          <IntegrationSecrets secrets={secrets.map((secret) => ({
            key: secret.key, label: secret.label, group: secret.group, configured: secret.configured,
            maskedHint: secret.maskedHint, updatedAt: secret.updatedAt?.toISOString() ?? null,
          }))} />
          <section className="admin-panel max-w-3xl p-5 text-xs text-ink/55">
            <h2 className="mb-2 text-sm font-semibold text-ink">ذخیره‌سازی رسانه</h2>
            <p>درایور فعال از متغیر محیطی STORAGE_DRIVER خوانده می‌شود. مصرف کتابخانه رسانه: {formatNumber(media.files)} فایل — {formatNumber(Math.round(media.bytes / 1024))} کیلوبایت.</p>
            <p className="mt-2">تغییر درایور نیازمند تغییر متغیر محیطی و راه‌اندازی مجدد است؛ کلیدهای Cloudinary را در همین بخش ثبت کنید.</p>
          </section>
        </div>
      ) : null}

      {tab === "analytics" ? (
        <div className="space-y-4">
          <SimpleSettingsForm
            title="تحلیل رفتار و رضایت"
            description="جمع‌آوری رویدادهای داخلی، نیاز به رضایت و مدت نگهداری داده خام را کنترل کنید. تغییرات بلافاصله اعمال می‌شوند."
            fields={[
              { key: "analytics.enabled", label: "فعال بودن جمع‌آوری رویداد", type: "checkbox", hint: "در صورت خاموش بودن، API رویدادها را نمی‌پذیرد." },
              { key: "analytics.requireConsent", label: "نیاز به رضایت کاربر برای تحلیل", type: "checkbox", hint: "در صورت فعال بودن، بنر رضایت نمایش داده می‌شود." },
              { key: "analytics.retentionDays", label: "مدت نگهداری رویداد خام (روز)", type: "number", hint: "حداقل ۷ و حداکثر ۷۳۰ روز" },
              { key: "privacy.marketingConsent", label: "الزام رضایت برای پیام بازاریابی", type: "checkbox" },
              { key: "privacy.analyticsCookieDays", label: "مدت اعتبار کوکی تحلیل (روز)", type: "number" },
            ]}
            values={{
              "analytics.enabled": values["analytics.enabled"] ?? "true",
              "analytics.requireConsent": values["analytics.requireConsent"] ?? "false",
              "analytics.retentionDays": values["analytics.retentionDays"] ?? String(analyticsSettings.retentionDays),
              "privacy.marketingConsent": values["privacy.marketingConsent"] ?? "true",
              "privacy.analyticsCookieDays": values["privacy.analyticsCookieDays"] ?? "90",
            }}
          />
          <div className="admin-panel max-w-3xl p-5 text-xs leading-6 text-ink/55">
            <h2 className="mb-2 text-sm font-semibold text-ink">اصول حریم خصوصی</h2>
            <p>شناسه نشست یک توکن تصادفی HttpOnly است؛ هیچ اثر انگشت دستگاه، محتوای فرم، رمز، OTP یا اطلاعات کارت ثبت نمی‌شود. ربات‌ها فیلتر می‌شوند و حذف خودکار داده خام طبق مدت نگهداری انجام می‌شود.</p>
            <p className="mt-2"><Link href="/admin/analytics" className="text-primary hover:underline">مشاهده داشبورد تحلیل</Link> — <Link href="/admin/security" className="text-primary hover:underline">امنیت و نشست‌ها</Link></p>
          </div>
        </div>
      ) : null}

      {tab === "operations" ? (
        <div className="space-y-4">
          <SimpleSettingsForm
            title="عملیات، پشتیبان‌گیری و فاکتور"
            description="این تنظیمات فقط وضعیت و سیاست‌ها را ثبت می‌کنند. پشتیبان‌گیری واقعی توسط سرویس زیرساخت شما انجام می‌شود و باید به cron/backup خارجی متصل شود."
            fields={[
              { key: "backup.frequency", label: "دوره پشتیبان‌گیری", type: "select", options: [{ value: "daily", label: "روزانه" }, { value: "weekly", label: "هفتگی" }, { value: "monthly", label: "ماهانه" }] },
              { key: "backup.retentionDays", label: "نگهداری پشتیبان (روز)", type: "number" },
              { key: "backup.lastRunAt", label: "آخرین پشتیبان‌گیری (ISO)", type: "text", hint: "توسط اپراتور یا اسکریپت پشتیبان به‌روزرسانی می‌شود." },
              { key: "store.orderPrefix", label: "پیشوند شماره سفارش", type: "text" },
              { key: "store.invoiceFooter", label: "متن پایین فاکتور", type: "text" },
            ]}
            values={{
              "backup.frequency": values["backup.frequency"] ?? "daily",
              "backup.retentionDays": values["backup.retentionDays"] ?? "30",
              "backup.lastRunAt": values["backup.lastRunAt"] ?? "",
              "store.orderPrefix": values["store.orderPrefix"] ?? "ILK",
              "store.invoiceFooter": values["store.invoiceFooter"] ?? "",
            }}
          />
          <div className="admin-panel max-w-3xl p-5 text-xs leading-6 text-ink/55">
            <h2 className="mb-2 text-sm font-semibold text-ink">نگهداری دوره‌ای</h2>
            <p>وظیفه نگهداری (انتشار محتوای زمان‌بندی‌شده، حذف رویدادهای قدیمی و پاکسازی رویدادهای سیستمی) از مسیر محافظت‌شده cron قابل اجراست:</p>
            <code dir="ltr" className="mt-2 block rounded-lg bg-canvas p-3 text-[10px]">POST /api/cron/maintenance — Authorization: Bearer $CRON_SECRET</code>
            <p className="mt-2">وضعیت آخرین اجراها در <Link href="/admin/system" className="text-primary hover:underline">سلامت سیستم</Link> دیده می‌شود.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
