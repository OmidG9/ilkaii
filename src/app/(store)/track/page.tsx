import type { Metadata } from "next";
import { HelpCircle, MapPin, PackageCheck, Search, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { TrackForm } from "@/components/track-form";

export const metadata: Metadata = { title: "پیگیری سفارش", robots: { index: false } };

const steps = [
  { icon: PackageCheck, title: "آماده‌سازی", text: "بررسی و بسته‌بندی سفارش" },
  { icon: Truck, title: "ارسال", text: "تحویل به پست یا پیک" },
  { icon: MapPin, title: "تحویل", text: "رسیدن به آدرس شما" },
];

export default function TrackPage() {
  return (
    <div className="container-luxury py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "پیگیری سفارش" }]} />

      <header className="relative overflow-hidden rounded-[32px] border border-line bg-surface p-8 sm:p-12">
        <div aria-hidden className="grain absolute inset-0 opacity-50" />
        <div className="relative max-w-2xl">
          <p className="eyebrow">ORDER TRACKING / WHERE IS IT?</p>
          <h1 className="mt-4 text-balance text-4xl font-semibold sm:text-5xl">
            مسیر بسته را
            <span className="font-display italic text-primary/45"> ببینید</span>
          </h1>
          <p className="mt-4 text-sm leading-8 text-ink/55">
            شمارهٔ سفارش و شمارهٔ موبایل خریدار را وارد کنید. وضعیت، تاریخچه و کد رهگیری در همان لحظه نمایش داده می‌شود.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-line bg-canvas px-4 py-3">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-[11px] font-semibold">{title}</p>
                  <p className="text-[10px] text-ink/40">{text}</p>
                </div>
                <span className="mr-auto text-[10px] text-ink/25">{["۰۱", "۰۲", "۰۳"][index]}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
        <TrackForm />

        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <Search className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">شمارهٔ سفارش را ندارید؟</h2>
            <p className="mt-2 text-xs leading-6 text-ink/50">در ایمیل تأیید یا بخش سفارش‌های حساب کاربری قابل مشاهده است. اگر وارد حساب شده‌اید، مستقیم از آنجا پیگیری کنید.</p>
            <ButtonLink href="/account/orders" variant="outline" size="sm" className="mt-4 w-full">سفارش‌های من</ButtonLink>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">نیاز به کمک دارید؟</h2>
            <p className="mt-2 text-xs leading-6 text-ink/50">اگر وضعیت سفارش تغییر نکرده یا کد رهگیری ندارید، با ذکر شمارهٔ سفارش با پشتیبانی تماس بگیرید.</p>
            <ButtonLink href="/contact" size="sm" className="mt-4 w-full">تماس با پشتیبانی</ButtonLink>
          </div>
          <div className="rounded-2xl bg-canvas p-5 text-[11px] leading-6 text-ink/40">
            اطلاعات پیگیری تنها با شمارهٔ سفارش و شمارهٔ موبایل خریدار نمایش داده می‌شود تا حریم خصوصی سفارش شما حفظ شود.
          </div>
        </aside>
      </div>
    </div>
  );
}
