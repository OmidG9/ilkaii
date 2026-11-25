import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardStats } from "@/services/admin";
import { lowStockVariants } from "@/services/catalog";
import { Card, SectionTitle } from "@/components/ui/display";
import { formatToman } from "@/lib/money";
import { formatJalali, formatNumber } from "@/lib/persian";
import { orderStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "مدیریت", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [stats, lowStock] = await Promise.all([getDashboardStats(), lowStockVariants()]);
  const maxSales = Math.max(1, ...stats.salesByDay.map((day) => day.total));

  const cards = [
    { label: "کل سفارشها", value: formatNumber(stats.totalOrders), href: "/admin/orders" },
    { label: "سفارشهای پرداختشده", value: formatNumber(stats.paidOrders), href: "/admin/orders" },
    { label: "سفارشهای در انتظار", value: formatNumber(stats.pendingOrders), href: "/admin/orders" },
    { label: "درآمد", value: formatToman(stats.revenue), href: "/admin/orders" },
    { label: "محصولات فعال", value: formatNumber(stats.products), href: "/admin/products" },
    { label: "موجودی کم", value: formatNumber(stats.lowStock), href: "/admin/inventory" },
    { label: "مشتریان", value: formatNumber(stats.customers), href: "/admin/customers" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">نمای کلی</h1>
        <p className="mt-2 text-sm text-ink/60">خلاصهای از وضعیت فروشگاه و سفارشها.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="surface-card p-5 transition-colors hover:border-primary">
            <p className="text-xs text-ink/50">{card.label}</p>
            <p dir="ltr" className="mt-2 text-lg font-semibold text-primary">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">فروش ۱۴ روز اخیر</h2>
          {stats.salesByDay.length ? (
            <div className="flex h-56 items-end gap-2 overflow-x-auto pb-2" dir="ltr">
              {stats.salesByDay.map((day) => (
                <div key={day.day} className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-2" title={`${day.day}: ${formatToman(day.total)}`}>
                  <div
                    className="w-full rounded-t-lg bg-primary/80 transition-all hover:bg-primary"
                    style={{ height: `${Math.max(4, Math.round((day.total / maxSales) * 100))}%` }}
                  />
                  <span className="text-[9px] text-ink/45">{day.day.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-ink/55">فروشی در این بازه ثبت نشده است.</p>}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">سفارشهای اخیر</h2>
          <div className="space-y-3">
            {stats.recentOrders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm hover:border-primary">
                <div className="min-w-0">
                  <p dir="ltr" className="truncate text-xs font-semibold text-primary">{order.orderNumber}</p>
                  <p className="mt-1 text-[11px] text-ink/50">{formatJalali(order.createdAt)}</p>
                </div>
                <div className="text-left">
                  <p dir="ltr" className="text-xs">{formatToman(order.total)}</p>
                  <p className="mt-1 text-[10px] text-ink/50">{orderStatusLabels[order.status]}</p>
                </div>
              </Link>
            ))}
            {!stats.recentOrders.length ? <p className="text-sm text-ink/55">سفارشی یافت نشد.</p> : null}
          </div>
        </Card>
      </div>

      <section>
        <SectionTitle title="موجودی کم" subtitle="تنوعهایی که نیاز به شارژ دارند" href="/admin/inventory" linkLabel="مدیریت موجودی" />
        <div className="table-wrap">
          <table className="table-luxury">
            <thead><tr><th>محصول</th><th>تنوع</th><th>موجودی</th><th>کد</th></tr></thead>
            <tbody>
              {lowStock.map((variant) => (
                <tr key={variant.id}>
                  <td><Link href={`/admin/products/${variant.product.id}`} className="text-primary hover:underline">{variant.product.name}</Link></td>
                  <td>{[variant.size, variant.color].filter(Boolean).join(" / ")}</td>
                  <td className="font-semibold text-red-600">{formatNumber(variant.stock)}</td>
                  <td dir="ltr" className="text-xs">{variant.sku}</td>
                </tr>
              ))}
              {!lowStock.length ? <tr><td colSpan={4} className="py-8 text-center text-ink/50">همه تنوعها موجودی کافی دارند.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
