import type { Metadata } from "next";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs, Card } from "@/components/ui/display";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "شرایط و قوانین", description: site.content.terms };
}

export default async function TermsPage() {
  const site = await getSiteConfig();
  return (
    <div className="container-luxury max-w-3xl py-12">
      <Breadcrumbs items={[{ label: "شرایط و قوانین" }]} />
      <h1 className="text-4xl font-semibold">شرایط و قوانین</h1>
      <Card className="mt-8 p-6 text-sm leading-8 text-ink/70">
        <p className="whitespace-pre-line">{site.content.terms}</p>
        <p className="mt-4">قیمتها و موجودی تا لحظه تأیید نهایی سرور معتبراند و ممکن است پیش از پرداخت تغییر کنند.</p>
      </Card>
    </div>
  );
}
