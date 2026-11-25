import type { Metadata } from "next";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs, Card } from "@/components/ui/display";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "بازگشت کالا", description: site.content.returnPolicy };
}

export default async function ReturnsPage() {
  const site = await getSiteConfig();
  return (
    <div className="container-luxury max-w-3xl py-12">
      <Breadcrumbs items={[{ label: "بازگشت کالا" }]} />
      <h1 className="text-4xl font-semibold">بازگشت کالا</h1>
      <Card className="mt-8 p-6">
        <p className="whitespace-pre-line text-sm leading-8 text-ink/70">{site.content.returnPolicy}</p>
        <p className="mt-6 border-t border-line pt-6 text-xs text-ink/50">
          برای ثبت درخواست بازگشت، به بخش سفارشها در حساب خود مراجعه کنید.
        </p>
      </Card>
    </div>
  );
}
