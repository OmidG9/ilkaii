import type { Metadata } from "next";
import Link from "next/link";
import { MailX } from "lucide-react";
import { UnsubscribeForm } from "@/components/unsubscribe-form";

export const metadata: Metadata = { title: "لغو عضویت خبرنامه", robots: { index: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <div className="container-luxury max-w-2xl py-16 sm:py-24">
      <div className="rounded-[32px] border border-line bg-surface p-8 sm:p-12">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MailX className="h-6 w-6" /></span>
        <p className="eyebrow mt-6">NEWSLETTER</p>
        <h1 className="mt-4 text-3xl font-semibold">لغو عضویت خبرنامه</h1>
        {token ? (
          <>
            <p className="mt-3 text-sm leading-7 text-ink/55">اگر دیگر نمی‌خواهید از مجموعه‌های تازه باخبر شوید، تأیید کنید. این کار بلافاصله انجام می‌شود.</p>
            <div className="mt-6"><UnsubscribeForm token={token} /></div>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-line bg-canvas p-5 text-sm leading-7 text-ink/55">
            لینک لغو عضویت معتبر نیست. اگر از دریافت ایمیل خسته شده‌اید، می‌توانید از صفحهٔ تماس با ما درخواست حذف بدهید.
          </div>
        )}
        <Link href="/" className="mt-8 inline-flex text-xs text-ink/45 hover:text-primary">بازگشت به فروشگاه</Link>
      </div>
    </div>
  );
}
