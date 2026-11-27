import type { Metadata } from "next";
import { Cookie, Database, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { getSiteConfig } from "@/config/site";
import { LegalPage } from "@/components/legal-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return { title: "حریم خصوصی", description: site.content.privacyPolicy, alternates: { canonical: "/privacy" } };
}

export default async function PrivacyPage() {
  const site = await getSiteConfig();

  return (
    <LegalPage
      eyebrow="POLICY / PRIVACY"
      title="حریم خصوصی"
      description="اطلاعات شما برای ارائهٔ خدمت استفاده می‌شود، نه برای فروش. این صفحه توضیح می‌دهد چه چیزی ذخیره می‌شود و چرا."
      icon={ShieldCheck}
      aside={
        <div className="rounded-2xl border border-line bg-surface p-5">
          <LockKeyhole className="h-5 w-5 text-primary" />
          <p className="mt-3 text-sm font-semibold">اطلاعات پرداخت</p>
          <p className="mt-2 text-xs leading-6 text-ink/50">اطلاعات کارت بانکی در فروشگاه ذخیره نمی‌شود و پرداخت توسط درگاه انجام می‌گیرد.</p>
        </div>
      }
    >
      <section>
        <h2 className="text-lg font-semibold text-ink">چه اطلاعاتی نگه می‌داریم؟</h2>
        <p className="mt-3">{site.content.privacyPolicy}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { icon: UserRound, title: "هویت و تماس", text: "نام، شماره موبایل، ایمیل و آدرس تحویل برای پردازش سفارش." },
            { icon: Database, title: "سفارش‌ها", text: "اقلام، مبلغ، وضعیت و تاریخچهٔ ارسال برای پشتیبانی و پیگیری." },
            { icon: Cookie, title: "تحلیل رفتار", text: "رویدادهای ناشناس برای بهبود فروشگاه؛ تنها با رضایت شما وقتی لازم است." },
            { icon: LockKeyhole, title: "امنیت", text: "نشست‌ها با توکن امضاشده و قابل ابطال؛ کدهای تأیید به‌صورت هش ذخیره می‌شوند." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-canvas p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs font-semibold">{title}</p>
              <p className="mt-1 text-[11px] leading-6 text-ink/45">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">چرا این اطلاعات را داریم؟</h2>
        <ul className="mt-4 space-y-3">
          {[
            "ثبت، پردازش و ارسال سفارش و اطلاع‌رسانی وضعیت آن.",
            "پاسخ‌گویی به درخواست‌های پشتیبانی، بازگشت کالا و پیگیری پرداخت.",
            "بهبود تجربهٔ خرید بر اساس آمار تجمیعی و ناشناس.",
            "حفاظت از حساب و فروشگاه در برابر سوءاستفاده و تقلب.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">مدت نگهداری و اشتراک‌گذاری</h2>
        <p className="mt-3">
          داده‌های سفارش تا زمانی که برای انجام تعهدات فروشگاه، پیگیری مرجوعی یا الزامات قانونی لازم است نگهداری می‌شوند. اطلاعات با فروشندگان ثالث فروخته نمی‌شود. برای ارسال، تنها اطلاعات لازم در اختیار پست یا پیک قرار می‌گیرد.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-ink">حقوق شما</h2>
        <p className="mt-3">
          می‌توانید دربارهٔ اطلاعات حساب خود سؤال بپرسید، آن را اصلاح کنید یا درخواست حذف اطلاعاتی را بدهید که نگهداری آن از نظر قانونی یا عملیاتی ضروری نیست. برای شروع، از صفحهٔ تماس با ما استفاده کنید.
        </p>
      </section>

      <p className="rounded-2xl bg-canvas px-4 py-3 text-xs leading-6 text-ink/45">
        با استفاده از فروشگاه، با این سیاست و پردازش اطلاعات برای اهداف توضیح‌داده‌شده موافقت می‌کنید. این متن ممکن است با تغییر رویه‌ها به‌روزرسانی شود.
      </p>
    </LegalPage>
  );
}
