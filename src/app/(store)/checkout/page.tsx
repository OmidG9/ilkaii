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
      <h1 className="mb-8 text-3xl font-semibold">تسویه حساب</h1>
      <CheckoutForm
        cart={cart}
        addresses={addresses}
        phone={profile.phone}
        shipping={site.shipping}
      />
    </div>
  );
}
