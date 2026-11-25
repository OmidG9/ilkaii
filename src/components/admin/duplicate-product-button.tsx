"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";

export function DuplicateProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" disabled={busy} onClick={async () => {
        if (!window.confirm("یک کپی پیش‌نویس از این محصول ساخته شود؟")) return;
        setBusy(true);
        setError(null);
        try {
          const response = await fetch(`/api/admin/products/${productId}/duplicate`, { method: "POST" });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body?.error?.message ?? "کپی محصول ناموفق بود");
          router.push(`/admin/products/${body.data.id}`);
          router.refresh();
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "خطای ارتباطی");
        } finally { setBusy(false); }
      }} className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-line px-4 text-sm hover:border-primary disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}کپی محصول
      </button>
      {error ? <span role="alert" className="text-[10px] text-red-600">{error}</span> : null}
    </span>
  );
}
