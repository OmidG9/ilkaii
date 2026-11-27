import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, RotateCcw, Undo2 } from "lucide-react";
import { getSiteConfig } from "@/config/site";
import { LegalPage } from "@/components/legal-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "بازگشت کالا", description: site.content.returnPolicy, alternates: { canonical: "/policies/returns" } };
}

export default async function ReturnsPage() {
  const site = await getSiteConfig();

  return (
    <LegalPage
      eyebrow="POLICY / RETURNS"
      title="بازگشت کالا"
      description="اگر قطعهٔ انتخاب‌شده مناسب نبود، مسیر بازگشت را ساده و قابل پیش‌بینی نگه داشته‌ایم."
      icon={Undo2}
      aside={
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-[10px] tracking-[0.22em] text-ink/35">WITHIN</p>
          <p className="mt-2 text-3xl font-semibold text-primary">۷ روز</p>
          <p className="mt-1 text-xs leading-6 text-ink/50">از زمان تحویل، برای ثبت درخواست بازگشت.</p>
          <Link href="/account/orders" className="mt-4 inline-flex text-xs font-medium text-primary hover:text-hover">ثبت درخواست از سفارش‌ها</Link>
        </div>
      }
    >
      <section>
        <h2 className="text-lg font-semibold text-ink">شرایط بازگشت</h2>
        <p className="mt-3">{site.content.returnPolicy}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: RotateCcw, title: "۷ روز فرصت", text: "از زمان تحویل مرسوله" },
            { icon: ClipboardCheck, title: "بدون استفاده", text: "برچسب و بسته‌بندی سالم" },
            { icon: CheckCircle2, title: "بررسی سریع", text: "حداکثر ۲ روز کاری" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-canvas p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs font-semibold">{title}</p>
              <p className="mt-1 text-[11px] text-ink/45">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">مراحل بازگشت</h2>
        <ol className="mt-5 space-y-5">
          {[
            { title: "ثبت درخواست", text: "از بخش «سفارش‌های من»، سفارش مورد نظر را باز کنید و درخواست بازگشت ثبت کنید. دلیل و توضیح کوتاه کمک می‌کند سریع‌تر بررسی شود." },
            { title: "تأیید و هماهنگی", text: "درخواست بررسی می‌شود. در صورت تأیید، روش ارسال مرجوعی و زمان مراجعهٔ پیک هماهنگ می‌شود." },
            { title: "دریافت و بررسی کالا", text: "کالا از نظر استفاده‌شدن، برچسب و سلامت بررسی می‌شود. این مرحله معمولاً یک تا دو روز کاری زمان می‌برد." },
            { title: "تعویض یا بازپرداخت", text: "بسته به انتخاب شما، سایز/رنگ دیگری ارسال می‌شود یا مبلغ به حساب بانکی بازمی‌گردد." },
          ].map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-xs font-semibold text-primary">{["۰۱", "۰۲", "۰۳", "۰۴"][index]}</span>
              <div>
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-sm leading-7 text-ink/55">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">چه زمانی قابل بازگشت نیست؟</h2>
        <ul className="mt-4 space-y-3">
          {[
            "کالا استفاده شده، شسته شده یا تغییر داده شده باشد.",
            "برچسب اصلی جدا شده یا بسته‌بندی آسیب جدی دیده باشد.",
            "درخواست پس از ۷ روز از تحویل ثبت شده باشد.",
            "کالای سفارشی یا اصلاح‌شده، مگر دارای ایراد تولیدی باشد.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />{item}</li>
          ))}
        </ul>
      </section>

      <p className="rounded-2xl bg-canvas px-4 py-3 text-xs leading-6 text-ink/45">
        برای کالاهای حراج و آخرین موجودی، شرایط بازگشت یکسان است؛ اما در صورت تعویض، موجودی سایز دیگر تضمین نمی‌شود. در صورت ایراد تولیدی، هزینهٔ ارسال با فروشگاه است.
      </p>
    </LegalPage>
  );
}
