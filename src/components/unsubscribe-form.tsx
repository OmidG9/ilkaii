"use client";

import { useState } from "react";

export function UnsubscribeForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (done) return <p className="text-sm text-emerald-700">عضویت شما در خبرنامه لغو شد.</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm leading-7 text-ink/60">با تأیید، دیگر پیام‌های تبلیغاتی برای شما ارسال نمی‌شود. پیام‌های ضروری مرتبط با سفارش همچنان ارسال می‌شوند.</p>
      <button type="button" disabled={busy} onClick={async () => {
        setBusy(true);
        setError(null);
        try {
          const response = await fetch("/api/newsletter/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body?.error?.message ?? "لغو عضویت ناموفق بود");
          setDone(true);
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "خطای ارتباطی");
        } finally { setBusy(false); }
      }} className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-sm text-white disabled:opacity-50">{busy ? "در حال لغو…" : "لغو عضویت خبرنامه"}</button>
      {error ? <p role="alert" className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
