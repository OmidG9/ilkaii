import type { Metadata } from "next";
import { getCartView } from "@/services/cart";
import { getSiteConfig } from "@/config/site";
import { CartView } from "@/components/cart-view";
import { Breadcrumbs } from "@/components/ui/display";
import { shippingCost } from "@/lib/money";

export const metadata: Metadata = { title: "سبد خرید", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [cart, site] = await Promise.all([getCartView(), getSiteConfig()]);
  return (
    <div className="container-luxury py-10">
      <Breadcrumbs items={[{ label: "سبد خرید" }]} />
      <h1 className="mb-8 text-3xl font-semibold">سبد خرید</h1>
      <CartView
        initialCart={cart}
        shipping={shippingCost(site.shipping, "POSTAL", cart.subtotal)}
        freeThreshold={site.shipping.freeThreshold}
      />
    </div>
  );
}
