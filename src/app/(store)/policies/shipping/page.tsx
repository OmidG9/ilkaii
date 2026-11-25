import type { Metadata } from "next";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs, Card } from "@/components/ui/display";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "ارسال و تحویل", description: site.content.shippingPolicy };
}

export default async function ShippingPolicyPage() {
  const site = await getSiteConfig();
  return (
    <div className="container-luxury max-w-3xl py-12">
      <Breadcrumbs items={[{ label: "ارسال و تحویل" }]} />
      <h1 className="text-4xl font-semibold">ارسال و تحویل</h1>
      <Card className="mt-8 p-6">
        <p className="whitespace-pre-line text-sm leading-8 text-ink/70">{site.content.shippingPolicy}</p>
        <div className="mt-6 grid gap-3 border-t border-line pt-6 text-sm sm:grid-cols-3">
          <div><p className="text-xs text-ink/50">پست</p><p dir="ltr">{formatToman(site.shipping.postal)}</p></div>
          <div><p className="text-xs text-ink/50">پیک</p><p dir="ltr">{formatToman(site.shipping.courier)}</p></div>
          <div><p className="text-xs text-ink/50">تحویل حضوری</p><p dir="ltr">{formatToman(site.shipping.pickup)}</p></div>
        </div>
        <p className="mt-4 text-xs text-ink/50">ارسال سفارشهای بالای {formatToman(site.shipping.freeThreshold)} رایگان است.</p>
      </Card>
    </div>
  );
}
