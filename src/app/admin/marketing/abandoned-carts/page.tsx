import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { abandonedCarts } from "@/services/marketing";
import { AdminDataTable, AdminPageHeader } from "@/components/admin/admin-widgets";
import { formatJalali, formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";

export const metadata: Metadata = { title: "سبدهای رهاشده" };
export const dynamic = "force-dynamic";

export default async function AdminAbandonedCartsPage() {
  await requirePagePermission("marketing.manage");
  const carts = await abandonedCarts();
  const totalValue = carts.reduce((sum, cart) => sum + cart.value, 0);
  return (
    <div>
      <AdminPageHeader
        title="سبدهای رهاشده"
        description={`${formatNumber(carts.length)} سبد بدون خرید در بیش از ۲ ساعت گذشته — ارزش کل ${formatToman(totalValue)}. ارسال پیام فقط برای کاربران دارای رضایت بازاریابی مجاز است.`}
      />
      <AdminDataTable
        rows={carts}
        rowKey={(cart) => cart.id}
        emptyText="سبد رهاشده‌ای وجود ندارد."
        columns={[
          { key: "user", header: "مشتری", render: (cart) => cart.user ? (
            <div>
              <Link href={`/admin/customers/${cart.user.id}`} className="text-xs font-medium text-primary hover:underline">{[cart.user.firstName, cart.user.lastName].filter(Boolean).join(" ") || cart.user.phone}</Link>
              <p dir="ltr" className="mt-0.5 text-[10px] text-ink/45">{cart.user.phone}</p>
            </div>
          ) : "—" },
          { key: "products", header: "محصولات", render: (cart) => <span className="block max-w-80 truncate text-[11px]">{cart.products.join("، ")}</span> },
          { key: "itemCount", header: "تعداد", render: (cart) => formatNumber(cart.itemCount) },
          { key: "value", header: "ارزش سبد", ltr: true, render: (cart) => formatToman(cart.value) },
          { key: "updatedAt", header: "آخرین تغییر", render: (cart) => <span className="text-[10px]">{formatJalali(cart.updatedAt, true)}</span> },
          { key: "consent", header: "رضایت بازاریابی", render: (cart) => <span className={`rounded-full px-2 py-0.5 text-[10px] ${cart.user?.marketingOptIn ? "bg-emerald-500/10 text-emerald-700" : "bg-line text-ink/45"}`}>{cart.user?.marketingOptIn ? "دارد" : "ندارد"}</span> },
        ]}
      />
    </div>
  );
}
