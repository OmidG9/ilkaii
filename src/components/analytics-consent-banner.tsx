"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Only shown when the operator enables consent-required analytics. */
export function AnalyticsConsentBanner() {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  if (hidden) return null;

  const choose = async (analytics: boolean, marketing: boolean) => {
    setBusy(true);
    try {
      await fetch("/api/analytics/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ analytics, marketing }),
      });
      setHidden(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-label="تنظیمات تحلیل رفتار" className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-line bg-surface p-4 shadow-soft sm:inset-x-auto sm:left-6 sm:max-w-md">
      <p className="text-sm font-semibold">تجربه بهتری برای شما</p>
      <p className="mt-1 text-xs leading-6 text-ink/60">
        برای تحلیل ناشناس بازدیدها و بهبود فروشگاه اجازه می‌دهید؟ هیچ اطلاعات ورود، پرداخت یا فرم خصوصی ثبت نمی‌شود.
        <Link href="/privacy" className="mx-1 text-primary underline">حریم خصوصی</Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void choose(true, true)} className="min-h-10 rounded-xl bg-primary px-4 text-xs text-white disabled:opacity-50">موافقم</button>
        <button type="button" disabled={busy} onClick={() => void choose(false, false)} className="min-h-10 rounded-xl border border-line px-4 text-xs text-ink/60 disabled:opacity-50">فقط ضروری</button>
      </div>
    </div>
  );
}
