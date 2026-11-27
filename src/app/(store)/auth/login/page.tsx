import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Breadcrumbs } from "@/components/ui/display";
import { Marquee } from "@/components/editorial";
import { safeNextPath } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "ورود", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  return (
    <div className="container-luxury py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "ورود" }]} />
      <div className="overflow-hidden rounded-[36px] border border-line bg-surface">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative flex flex-col justify-center bg-canvas p-6 sm:p-10">
            <LoginForm next={next} />
            <p className="mx-auto mt-5 max-w-md text-center text-[11px] leading-6 text-ink/40">
              ورود امن با رمز یک‌بارمصرف؛ بدون رمز عبور، بدون اطلاعات اضافه. حساب شما به شمارهٔ موبایل متصل است.
            </p>
          </div>

          <aside className="relative hidden overflow-hidden bg-primary p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div aria-hidden className="absolute -left-20 -top-20 h-72 w-72 rounded-full border-[50px] border-white/5" />
            <span aria-hidden className="pointer-events-none absolute -bottom-16 left-2 font-display text-[220px] leading-none text-white/[0.04]">i</span>
            <div className="relative">
              <p className="text-[10px] tracking-[0.32em] text-white/45">MEMBER SPACE</p>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight">کمد شما،<br /><span className="font-display italic text-white/50">یک‌جا.</span></h1>
              <p className="mt-4 max-w-sm text-sm leading-7 text-white/55">سفارش‌ها، علاقه‌مندی‌ها و اطلاعات ارسال، همه در یک فضای آرام.</p>
              <ul className="mt-8 space-y-4 text-xs text-white/65">
                <li className="flex items-center gap-3"><PackageCheck className="h-4 w-4 text-white/40" /> پیگیری سفارش‌ها و تاریخچهٔ خرید</li>
                <li className="flex items-center gap-3"><Heart className="h-4 w-4 text-white/40" /> ذخیرهٔ قطعه‌های مورد علاقه</li>
                <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-white/40" /> نشست امن و قابل ابطال</li>
                <li className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-white/40" /> دسترسی به پیشنهادهای اعضا</li>
              </ul>
            </div>
            <div className="relative mt-10 border-t border-white/10 pt-5">
              <p className="text-[11px] leading-6 text-white/45">ورود یعنی پذیرش <Link href="/terms" className="underline underline-offset-4 hover:text-white">شرایط استفاده</Link> و <Link href="/privacy" className="underline underline-offset-4 hover:text-white">حریم خصوصی</Link>.</p>
              <Link href="/shop" className="mt-4 inline-flex items-center gap-2 text-xs text-white/70 hover:text-white">ادامهٔ خرید بدون ورود <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </aside>
        </div>
      </div>
      <Marquee className="mt-8 rounded-2xl" items={["WELCOME BACK", "خوش برگشتید", "YOUR WARDROBE, IN ONE PLACE", "ورود امن با پیامک"]} />
    </div>
  );
}
