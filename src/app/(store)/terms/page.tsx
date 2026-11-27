import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { getSiteConfig } from "@/config/site";
import { LegalPage } from "@/components/legal-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "شرایط و قوانین", description: site.content.terms, alternates: { canonical: "/terms" } };
}

const sections = [
  {
    title: "۱. پذیرش شرایط",
    body: "با ثبت سفارش یا استفاده از حساب کاربری، این شرایط را می‌پذیرید. اگر با بخشی از آن موافق نیستید، لطفاً پیش از خرید با پشتیبانی صحبت کنید.",
  },
  {
    title: "۲. قیمت‌ها و پرداخت",
    body: "تمام قیمت‌ها به تومان و شامل مبلغ کالا است؛ هزینهٔ ارسال جداگانه محاسبه می‌شود. قیمت و موجودی تا لحظهٔ تأیید نهایی سرور معتبرند و در صورت تغییر، پیش از پرداخت به شما نمایش داده می‌شوند.",
  },
  {
    title: "۳. سفارش و تأیید",
    body: "ثبت سفارش به معنای نهایی شدن آن نیست. سفارش پس از تأیید پرداخت (یا تأیید پرداخت در محل) وارد مرحلهٔ آماده‌سازی می‌شود. در صورت اتمام موجودی، سفارش لغو و مبلغ بازگردانده می‌شود.",
  },
  {
    title: "۴. ارسال و تحویل",
    body: "زمان تحویل تخمینی است و به شهر، روش ارسال و شرایط شرکت حمل بستگی دارد. مسئولیت صحت آدرس و شمارهٔ تماس با خریدار است.",
  },
  {
    title: "۵. بازگشت و تعویض",
    body: "شرایط بازگشت در صفحهٔ «بازگشت کالا» توضیح داده شده است. کالا باید استفاده نشده و دارای برچسب اصلی باشد. درخواست‌های پس از مهلت اعلام‌شده قابل بررسی نیستند، مگر در موارد ایراد تولیدی.",
  },
  {
    title: "۶. حساب کاربری",
    body: "شما مسئول حفظ دسترسی به شمارهٔ موبایل و حساب خود هستید. در صورت مشاهدهٔ فعالیت مشکوک، از طریق پشتیبانی اطلاع دهید تا نشست‌ها بررسی و در صورت نیاز باطل شوند.",
  },
  {
    title: "۷. مالکیت محتوا",
    body: "متن‌ها، تصاویر، طراحی و نشان تجاری فروشگاه متعلق به ilkaii است. استفادهٔ تجاری یا بازنشر بدون اجازه مجاز نیست.",
  },
  {
    title: "۸. تغییر شرایط",
    body: "ممکن است این شرایط برای هماهنگی با تغییر رویه‌ها یا قوانین به‌روزرسانی شود. نسخهٔ معتبر، همین صفحه است و تاریخچهٔ سفارش‌ها را تحت تأثیر قرار نمی‌دهد.",
  },
];

export default async function TermsPage() {
  const site = await getSiteConfig();

  return (
    <LegalPage
      eyebrow="POLICY / TERMS"
      title="شرایط و قوانین"
      description="قواعد روشنی که رابطهٔ شما و فروشگاه را مشخص می‌کند؛ بدون بندهای پنهان."
      icon={Scale}
    >
      <p className="rounded-2xl bg-canvas px-4 py-3 text-sm leading-7 text-ink/60">{site.content.terms}</p>

      <div className="space-y-7">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold text-ink">{section.title}</h2>
            <p className="mt-2">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="rounded-2xl bg-canvas px-4 py-3 text-xs leading-6 text-ink/45">
        در صورت وجود ابهام یا تناقض میان این متن و اطلاعات صفحهٔ محصول، ابتدا با پشتیبانی تماس بگیرید. اطلاعات صفحهٔ محصول و شرایط بازگشت، مکمل این قوانین هستند.
      </p>
    </LegalPage>
  );
}
