import type { Metadata } from "next";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs, Card } from "@/components/ui/display";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "حریم خصوصی", description: site.content.privacyPolicy };
}

export default async function PrivacyPage() {
  const site = await getSiteConfig();
  return (
    <div className="container-luxury max-w-3xl py-12">
      <Breadcrumbs items={[{ label: "حریم خصوصی" }]} />
      <h1 className="text-4xl font-semibold">حریم خصوصی</h1>
      <Card className="mt-8 space-y-4 p-6 text-sm leading-8 text-ink/70">
        <p className="whitespace-pre-line">{site.content.privacyPolicy}</p>
        <p>کدهای تأیید به صورت هش ذخیره میشوند و نشستها قابل ابطالاند.</p>
        <p>اطلاعات پرداخت در این فروشگاه ذخیره نمیشود و پرداخت توسط درگاه تأیید میگردد.</p>
      </Card>
    </div>
  );
}
