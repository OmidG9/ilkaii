import type { Metadata } from "next";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { getProfile, listAddresses, listUserOrders, listWishlist } from "@/services/account";
import { ProfileForm } from "@/components/profile-form";
import { SectionTitle } from "@/components/ui/display";
import { formatJalali, formatNumber } from "@/lib/persian";

export const metadata: Metadata = { title: "حساب من", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requirePageUser();
  const [profile, orders, addresses, wishlist] = await Promise.all([
    getProfile(user.id),
    listUserOrders(user.id, 1, 5),
    listAddresses(user.id),
    listWishlist(user.id),
  ]);
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold">سلام {profile.firstName ?? "به فروشگاه خوش آمدید"}</h1>
        <p className="mt-2 text-sm text-ink/60">عضو از تاریخ {formatJalali(profile.createdAt)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "سفارشها", value: orders.total, href: "/account/orders" },
          { label: "آدرسها", value: addresses.length, href: "/account/addresses" },
          { label: "علاقهمندیها", value: wishlist.length, href: "/account/wishlist" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="surface-card p-5 transition-colors hover:border-primary">
            <p className="text-xs text-ink/50">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-primary">{formatNumber(item.value)}</p>
          </Link>
        ))}
      </div>

      <ProfileForm profile={profile} />

      <section>
        <SectionTitle title="آخرین سفارشها" href="/account/orders" linkLabel="مشاهده همه" />
        {orders.items.length ? (
          <div className="table-wrap">
            <table className="table-luxury">
              <thead><tr><th>شماره سفارش</th><th>تاریخ</th><th>وضعیت</th><th>مبلغ</th></tr></thead>
              <tbody>
                {orders.items.map((order) => (
                  <tr key={order.id}>
                    <td><Link dir="ltr" href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} className="text-primary underline">{order.orderNumber}</Link></td>
                    <td>{formatJalali(order.createdAt)}</td>
                    <td>{order.status}</td>
                    <td dir="ltr">{formatNumber(order.total)} تومان</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-ink/55">هنوز سفارشی ثبت نکردهاید.</p>}
      </section>
    </div>
  );
}
