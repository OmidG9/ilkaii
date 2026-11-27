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

      <header className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="eyebrow">YOUR BAG</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">سبد خرید</h1>
          <p className="mt-2 text-xs text-ink/45">قیمت‌ها لحظه‌ای از سرور خوانده می‌شوند و تا پرداخت معتبرند.</p>
        </div>
        <ol className="flex items-center gap-2 text-[10px]">
          {[
            { label: "سبد", active: true },
            { label: "اطلاعات ارسال", active: false },
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

      <CartView
        initialCart={cart}
        shipping={shippingCost(site.shipping, "PISHTAZ", cart.subtotal)}
        freeThreshold={site.shipping.freeThreshold}
      />
    </div>
  );
}
