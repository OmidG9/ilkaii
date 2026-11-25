import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { campaignPerformance, marketingStats } from "@/services/marketing";
import { AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";
import { Megaphone, Mail, ShoppingCart, TicketPercent, Users, Send } from "lucide-react";

export const metadata: Metadata = { title: "مرکز بازاریابی" };
export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  await requirePagePermission("marketing.manage");
  const [stats, performance] = await Promise.all([marketingStats(), campaignPerformance()]);
  return (
    <div className="space-y-6">
      <AdminPageHeader title="مرکز بازاریابی" description="کمپین‌ها، خبرنامه، سبدهای رهاشده و عملکرد UTM. ارسال تبلیغاتی تنها با رضایت ثبت‌شده انجام می‌شود." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="کمپین‌ها" value={formatNumber(stats.campaigns)} hint={`فعال: ${formatNumber(stats.active)}`} icon={<Megaphone className="h-5 w-5" />} href="/admin/marketing/campaigns" />
        <AdminStatCard label="مشترکان خبرنامه" value={formatNumber(stats.subscribers)} hint={`فعال: ${formatNumber(stats.activeSubscribers)}`} icon={<Mail className="h-5 w-5" />} href="/admin/marketing/subscribers" />
        <AdminStatCard label="سبدهای رهاشده" value={formatNumber(stats.abandonedCarts)} hint={formatToman(stats.abandonedCartValue)} icon={<ShoppingCart className="h-5 w-5" />} href="/admin/marketing/abandoned-carts" />
        <AdminStatCard label="کدهای تخفیف" value="مدیریت" icon={<TicketPercent className="h-5 w-5" />} href="/admin/coupons" />
      </div>

      <section className="admin-panel p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">عملکرد کمپین‌ها</h2>
          <Link href="/admin/analytics" className="text-xs text-primary hover:underline">تحلیل کامل</Link>
        </div>
        <div className="table-wrap border-0">
          <table className="table-luxury min-w-0">
            <thead><tr><th>کمپین</th><th>منبع</th><th>نشست</th><th>خرید</th><th>درآمد</th><th>تبدیل</th></tr></thead>
            <tbody>
              {performance.map((row) => (
                <tr key={`${row.campaign}-${row.source}`}>
                  <td className="text-xs">{row.campaign}</td>
                  <td className="text-xs">{row.source}</td>
                  <td>{formatNumber(row.sessions)}</td>
                  <td>{formatNumber(row.purchases)}</td>
                  <td dir="ltr" className="text-xs">{formatToman(row.revenue)}</td>
                  <td className="text-xs">{row.conversion === null ? "—" : `${formatNumber(Math.round(row.conversion * 10) / 10)}٪`}</td>
                </tr>
              ))}
              {!performance.length ? <tr><td colSpan={6} className="py-8 text-center text-xs text-ink/45">داده کمپینی ثبت نشده است.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/marketing/campaigns", label: "کمپین جدید", icon: Send },
          { href: "/admin/marketing/subscribers", label: "مدیریت خبرنامه", icon: Users },
          { href: "/admin/marketing/abandoned-carts", label: "سبدهای رهاشده", icon: ShoppingCart },
          { href: "/admin/coupons", label: "کدهای تخفیف", icon: TicketPercent },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="admin-panel flex items-center gap-3 p-4 text-sm hover:border-primary">
            <item.icon className="h-5 w-5 text-primary" />{item.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
