import type { Metadata } from "next";
import { Clock3, MapPin, PackageCheck, Truck } from "lucide-react";
import { getSiteConfig } from "@/config/site";
import { LegalPage } from "@/components/legal-page";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "ارسال و تحویل", description: site.content.shippingPolicy, alternates: { canonical: "/policies/shipping" } };
}

export default async function ShippingPolicyPage() {
  const site = await getSiteConfig();
  const methods: Array<{ label: string; value: number; valueText?: string; note: string }> = [
    { label: "نرخ ثابت", value: site.shipping.flat, note: `نرخ ثابت ${formatToman(site.shipping.flat)}، سراسر کشور` },
    { label: "الو پیک", value: site.shipping.alopeyk, valueText: "نرخ روز", note: "فقط شهر تهران؛ کرایه هنگام تحویل بر عهدهٔ مشتری است" },
    { label: "پست پیشتاز", value: site.shipping.pishtaz, note: "۲ تا ۴ روز کاری، سراسر کشور" },
    { label: "تیپاکس", value: site.shipping.tipax, note: "ارسال ایمن و قابل پیگیری" },
  ];

  return (
    <LegalPage
      eyebrow="POLICY / SHIPPING"
      title="ارسال و تحویل"
      description="از لحظهٔ تأیید پرداخت تا رسیدن بسته به دست شما؛ شفاف، قابل پیگیری و بدون هزینهٔ پنهان."
      icon={Truck}
      aside={
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <p className="text-[10px] tracking-[0.22em] text-primary/60">FREE SHIPPING</p>
          <p className="mt-2 text-sm font-semibold">خرید بالای {formatToman(site.shipping.freeThreshold)}</p>
          <p className="mt-1 text-xs leading-6 text-ink/50">هزینهٔ ارسال به‌صورت خودکار صفر می‌شود.</p>
        </div>
      }
    >
      <section>
        <h2 className="text-lg font-semibold text-ink">روش‌های ارسال</h2>
        <p className="mt-3">{site.content.shippingPolicy}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {methods.map((method) => (
            <div key={method.label} className="rounded-2xl border border-line bg-canvas p-4">
              <p className="text-xs font-semibold">{method.label}</p>
              <p className="mt-2 text-sm font-medium text-primary">{method.valueText ?? (method.value === 0 ? "رایگان" : formatToman(method.value))}</p>
              <p className="mt-2 text-[11px] leading-5 text-ink/45">{method.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">مسیر سفارش شما</h2>
        <ol className="mt-5 space-y-5">
          {[
            { icon: Clock3, title: "تأیید و آماده‌سازی", text: "پس از تأیید پرداخت، سفارش طی ۱ تا ۳ روز کاری آماده و بسته‌بندی می‌شود." },
            { icon: PackageCheck, title: "بسته‌بندی و تحویل به پست/پیک", text: "بسته با بسته‌بندی ساده و قابل بازیافت تحویل داده می‌شود و کد رهگیری ثبت می‌گردد." },
            { icon: MapPin, title: "تحویل در مقصد", text: "زمان نهایی به شهر و روش ارسال بستگی دارد. وضعیت را از صفحهٔ پیگیری سفارش ببینید." },
          ].map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="flex gap-4">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink"><span className="mr-2 text-[10px] text-ink/35">{["۰۱", "۰۲", "۰۳"][index]}</span>{step.title}</p>
                  <p className="mt-1 text-sm leading-7 text-ink/55">{step.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">نکته‌های مهم</h2>
        <ul className="mt-4 space-y-3">
          {[
            "شمارهٔ تماس و آدرس باید دقیق و کامل باشد؛ مسئولیت تأخیر ناشی از اطلاعات ناقص بر عهدهٔ خریدار است.",
            "در روزهای تعطیل رسمی، پردازش و ارسال انجام نمی‌شود و زمان تحویل به روز کاری بعد منتقل می‌شود.",
            "در صورت عدم تحویل مرسوله به دلیل عدم حضور گیرنده، هماهنگی مجدد از طریق پشتیبانی انجام می‌شود.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />{item}</li>
          ))}
        </ul>
      </section>

      <p className="rounded-2xl bg-canvas px-4 py-3 text-xs leading-6 text-ink/45">
        هزینه‌های نمایش‌داده‌شده ممکن است بر اساس تنظیمات فروشگاه به‌روزرسانی شوند. مبلغ نهایی همیشه پیش از پرداخت نمایش داده می‌شود.
      </p>
    </LegalPage>
  );
}
