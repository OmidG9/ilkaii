import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteConfig } from "@/config/site";
import { Breadcrumbs, Card } from "@/components/ui/display";

export const metadata: Metadata = { title: "تماس با ما", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const site = await getSiteConfig();
  const channels = [
    { icon: Mail, label: "ایمیل", value: site.contact.email, href: `mailto:${site.contact.email}` },
    { icon: Phone, label: "تلفن", value: site.contact.phone, href: `tel:${site.contact.phone.replace(/[^+\d]/g, "")}` },
    { icon: MapPin, label: "آدرس", value: site.contact.address, href: undefined },
  ];
  return (
    <div className="container-luxury max-w-3xl py-12">
      <Breadcrumbs items={[{ label: "تماس با ما" }]} />
      <h1 className="text-4xl font-semibold">تماس با ما</h1>
      <p className="mt-4 text-sm leading-7 text-ink/65">
        اطلاعات تماس زیر از تنظیمات فروشگاه خوانده میشود و توسط مدیر قابل تغییر است.
      </p>
      <div className="mt-10 space-y-4">
        {channels.map(({ icon: Icon, label, value, href }) => (
          <Card key={label} className="flex items-center gap-4 p-6">
            <Icon className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-xs text-ink/50">{label}</p>
              {href ? (
                <a href={href} className="text-sm font-medium hover:text-primary" dir={label === "آدرس" ? undefined : "ltr"}>{value}</a>
              ) : (
                <p className="text-sm font-medium">{value}</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
