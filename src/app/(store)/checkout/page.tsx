import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth/session";
import { getCartView } from "@/services/cart";
import { getProfile, listAddresses } from "@/services/account";
import { getSiteConfig } from "@/config/site";
import { CheckoutForm } from "@/components/checkout-form";
import { Breadcrumbs } from "@/components/ui/display";

export const metadata: Metadata = { title: "تسویه حساب", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requirePageUser();
  const [cart, addresses, profile, site] = await Promise.all([
    getCartView(),
    listAddresses(user.id),
    getProfile(user.id),
    getSiteConfig(),
  ]);
  return (
    <div className="container-luxury py-10">
      <Breadcrumbs items={[{ label: "سبد خرید", href: "/cart" }, { label: "تسویه حساب" }]} />
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="eyebrow">CHECKOUT</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">تسویه حساب</h1>
          <p className="mt-2 text-xs text-ink/45">اطلاعات ارسال و پرداخت، امن و بدون ذخیرهٔ اطلاعات کارت.</p>
        </div>
        <ol className="flex items-center gap-2 text-[10px]">
          {[
            { label: "سبد", active: false },
            { label: "اطلاعات ارسال", active: true },
            { label: "پرداخت", active: false },
          ].map((step, index) => (
            <li key={step.label} className="flex items-center gap-2">
              <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 ${step.active ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink/35"}`}>
                <span>{["۰۱", "۰۲", "۰۳"][index]}</span>
                {step.label}
              </span>
              {index < 2 ? <span className="h-px w-4 bg-line" /> : null}
            </li>
          ))}
        </ol>
      </header>
      <CheckoutForm
        cart={cart}
        addresses={addresses}
        phone={profile.phone}
        shipping={site.shipping}
        couponEnabled={site.features.coupons}
      />
    </div>
  );
}
