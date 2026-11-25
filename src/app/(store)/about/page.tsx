import type { Metadata } from "next";
import Link from "next/link";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs, Card, SectionTitle } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "درباره ما", description: site.content.about };
}

export default async function AboutPage() {
  const site = await getSiteConfig();
  return (
    <div className="container-luxury max-w-4xl py-12">
      <Breadcrumbs items={[{ label: "درباره ما" }]} />
      <h1 className="text-4xl font-semibold">درباره {site.name}</h1>
      <p className="mt-6 whitespace-pre-line text-base leading-9 text-ink/70">{site.content.about}</p>
      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          { title: "کیفیت", text: "انتخاب پارچه و دوخت با دقت بالا" },
          { title: "سادگی", text: "طراحی مینیمال و کاربردی" },
          { title: "اصالت", text: "استایلی نزدیک به فرهنگ و سلیقه ایرانی" },
        ].map((item) => (
          <Card key={item.title} className="p-6">
            <h2 className="text-lg font-semibold text-primary">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-ink/60">{item.text}</p>
          </Card>
        ))}
      </section>
      <section className="mt-16">
        <SectionTitle title="با ما در تماس باشید" />
        <p className="text-sm leading-7 text-ink/65">
          سؤالی دارید؟ <Link href="/contact" className="text-primary underline">صفحه تماس با ما</Link> را ببینید.
        </p>
        <ButtonLink href="/shop" className="mt-6">مشاهده محصولات</ButtonLink>
      </section>
    </div>
  );
}
