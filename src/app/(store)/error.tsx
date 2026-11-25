"use client";

import { useEffect } from "react";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("storefront_error", { digest: error.digest });
  }, [error]);
  return (
    <div className="container-luxury flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-semibold">مشکلی پیش آمد</h1>
      <p className="mt-2 max-w-md text-sm leading-7 text-ink/55">صفحه موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.</p>
      <button type="button" onClick={reset} className="mt-5 inline-flex min-h-12 items-center rounded-2xl bg-primary px-6 text-sm text-white">تلاش دوباره</button>
    </div>
  );
}
