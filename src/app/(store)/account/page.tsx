import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Package, RotateCcw } from "lucide-react";
import { requirePageUser } from "@/lib/auth/session";
import { getProfile, listAddresses, listUserOrders, listWishlist } from "@/services/account";
import { ProfileForm } from "@/components/profile-form";
import { SectionTitle } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { formatJalali, formatNumber } from "@/lib/persian";
import { orderStatusLabels } from "@/lib/labels";

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
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow">MY ACCOUNT</p>
        <h1 className="mt-3 text-3xl font-semibold">{name ? `سلام ${name}` : "به حساب خود خوش آمدید"}</h1>
        <p className="mt-2 text-xs text-ink/50">عضو از {formatJalali(profile.createdAt)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "سفارش‌ها", value: orders.total, href: "/account/orders", icon: Package },
          { label: "آدرس‌ها", value: addresses.length, href: "/account/addresses", icon: MapPin },
          { label: "علاقه‌مندی‌ها", value: wishlist.length, href: "/account/wishlist", icon: Heart },
        ].map(({ label, value, href, icon: Icon }) => (
          <Link key={href} href={href} className="group surface-card p-5 transition-colors hover:border-primary">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-ink/50">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{formatNumber(value)}</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-canvas text-primary/60 transition-colors group-hover:bg-primary group-hover:text-white"><Icon className="h-4 w-4" /></span>
            </div>
          </Link>
        ))}
      </div>

      <ProfileForm profile={profile} />

      <section>
        <SectionTitle title="آخرین سفارش‌ها" subtitle="پنج سفارش اخیر شما" href="/account/orders" linkLabel="مشاهده همه" />
        {orders.items.length ? (
          <div className="space-y-3">
            {orders.items.map((order) => (
              <Link key={order.id} href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 text-sm transition-colors hover:border-primary">
                <div>
                  <p dir="ltr" className="font-semibold text-primary">{order.orderNumber}</p>
                  <p className="mt-1 text-[11px] text-ink/40">{formatJalali(order.createdAt)}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] text-primary">{orderStatusLabels[order.status]}</span>
                <p dir="ltr" className="text-sm font-semibold">{formatNumber(order.total)} تومان</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-ink/55">
            هنوز سفارشی ثبت نکرده‌اید. <Link href="/shop" className="text-primary underline">شروع خرید</Link>
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="مرجوعی و بازگشت" subtitle="اگر کالای خریداری‌شده را می‌خواهید برگردانید، از اینجا شروع کنید." />
        <div className="surface-card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RotateCcw className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">درخواست بازگشت کالا</p>
              <p className="mt-1 max-w-xl text-xs leading-6 text-ink/55">
                سفارش ارسال‌شده یا تحویل‌شده را انتخاب کنید، اقلام و تعداد را مشخص کنید و درخواست را ثبت کنید. وضعیت بررسی
                در همین بخش قابل پیگیری است.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ButtonLink href="/account/returns/new" size="sm">ثبت درخواست مرجوعی</ButtonLink>
            <ButtonLink href="/account/returns" variant="outline" size="sm">پیگیری درخواست‌ها</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
