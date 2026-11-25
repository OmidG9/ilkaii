"use client";

import { useEffect } from "react";
import { Alert, Card } from "@/components/ui/display";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("admin_error", { digest: error.digest });
  }, [error]);
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <h1 className="text-xl font-semibold">خطایی رخ داد</h1>
      <p className="mt-2 text-sm text-ink/55">بارگذاری این بخش مدیریت ناموفق بود. جزئیات فنی در گزارش سیستم ثبت می‌شود.</p>
      {error.digest ? <p dir="ltr" className="mt-2 text-[10px] text-ink/35">Ref: {error.digest}</p> : null}
      <div className="mt-5 flex justify-center gap-2">
        <Button type="button" onClick={reset}>تلاش دوباره</Button>
        <a href="/admin/dashboard" className="inline-flex min-h-12 items-center rounded-2xl border border-line px-6 text-sm hover:border-primary">بازگشت به داشبورد</a>
      </div>
      <div className="mt-5"><Alert tone="error">اگر خطا ادامه دارد، وضعیت پایگاه داده را در صفحه سلامت سیستم بررسی کنید.</Alert></div>
    </Card>
  );
}
