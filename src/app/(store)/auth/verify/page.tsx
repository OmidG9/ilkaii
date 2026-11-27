import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole, MessageSquareText } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Alert, Breadcrumbs } from "@/components/ui/display";
import { safeNextPath } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "تأیید کد", robots: { index: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  return (
    <div className="container-luxury py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "ورود" }, { label: "تأیید کد" }]} />
      <div className="mx-auto max-w-xl">
        <div className="mb-6 rounded-[28px] border border-line bg-surface p-6">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageSquareText className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold">کد تأیید را وارد کنید</p>
              <p className="mt-1 text-xs leading-6 text-ink/50">کد ۶ رقمی به شمارهٔ موبایل شما پیامک می‌شود. در محیط توسعه، کد آزمایشی در همان فرم نمایش داده می‌شود.</p>
            </div>
          </div>
          <div className="mt-4"><Alert>کد تأیید تنها از طریق پیامک ارسال می‌شود. هرگز کد را با کسی به اشتراک نگذارید.</Alert></div>
        </div>
        <LoginForm next={next} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/40">
          <Link href="/auth/login" className="inline-flex items-center gap-1 hover:text-primary"><ArrowRight className="h-3.5 w-3.5" /> تغییر شماره یا شروع دوباره</Link>
          <span className="inline-flex items-center gap-1"><LockKeyhole className="h-3.5 w-3.5" /> نشست امن</span>
        </div>
      </div>
    </div>
  );
}
