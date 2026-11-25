import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listCampaigns } from "@/services/marketing";
import { AdminCrudManager } from "@/components/admin/admin-crud";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { campaignChannelLabels, campaignStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "کمپین‌ها" };
export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  await requirePagePermission("marketing.manage");
  const campaigns = await listCampaigns();
  return (
    <div>
      <AdminPageHeader
        title="کمپین‌های بازاریابی"
        description="گیرندگان فقط از میان مشتریان/مشترکانی انتخاب می‌شوند که رضایت بازاریابی دارند. در محیط تولید بدون سرویس پیامک/ایمیل پیکربندی‌شده، ارسال مسدود می‌شود."
      />
      <AdminCrudManager
        title="همه کمپین‌ها"
        endpoint="/api/admin/marketing/campaigns"
        createLabel="کمپین جدید"
        wide
        sendEndpointPrefix="/api/admin/marketing/campaigns"
        sendLabel="ارسال"
        sendBlockedWhen={{ key: "status", value: "COMPLETED" }}
        items={campaigns.map((campaign) => ({
          id: campaign.id, name: campaign.name, channel: campaign.channel, status: campaign.status,
          subject: campaign.subject, content: campaign.content, audience: campaign.audience,
          couponId: campaign.couponId, startsAt: campaign.startsAt?.toISOString() ?? null,
          endsAt: campaign.endsAt?.toISOString() ?? null, scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
          utmSource: campaign.utmSource, utmMedium: campaign.utmMedium, utmCampaign: campaign.utmCampaign,
          coupon: campaign.coupon?.code,
        }))}
        columns={[
          { key: "name", label: "نام" },
          { key: "channel", label: "کانال", labelMap: campaignChannelLabels },
          { key: "status", label: "وضعیت", labelMap: campaignStatusLabels },
          { key: "audience", label: "مخاطب" },
          { key: "coupon", label: "کد تخفیف" },
          { key: "scheduledAt", label: "زمان‌بندی", type: "date" },
        ]}
        fields={[
          { key: "name", label: "نام کمپین", type: "text", required: true },
          { key: "channel", label: "کانال", type: "select", options: Object.entries(campaignChannelLabels).map(([value, label]) => ({ value, label })) },
          { key: "status", label: "وضعیت", type: "select", options: Object.entries(campaignStatusLabels).map(([value, label]) => ({ value, label })) },
          { key: "audience", label: "مخاطب", type: "select", options: [
            { value: "subscribers", label: "مشترکان خبرنامه" },
            { value: "customers", label: "مشتریان دارای رضایت بازاریابی" },
          ] },
          { key: "subject", label: "موضوع", type: "text" },
          { key: "content", label: "متن پیام", type: "textarea", rows: 6, required: true, hint: "از {{name}} برای نام گیرنده و {{unsubscribe_url}} برای لینک لغو عضویت استفاده کنید." },
          { key: "couponId", label: "شناسه کد تخفیف", type: "text", ltr: true },
          { key: "utmSource", label: "UTM Source", type: "text", ltr: true },
          { key: "utmMedium", label: "UTM Medium", type: "text", ltr: true },
          { key: "utmCampaign", label: "UTM Campaign", type: "text", ltr: true },
          { key: "scheduledAt", label: "زمان ارسال", type: "datetime" },
        ]}
      />
    </div>
  );
}
