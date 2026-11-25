"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/display";

export function DeleteButton({ endpoint, label, redirectTo }: {
  endpoint: string; label: string; redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (!window.confirm(`آیا از «${label}» اطمینان دارید؟ این عمل قابل بازگشت نیست.`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "حذف ناموفق بود");
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطای ارتباطی");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="danger" size="sm" disabled={busy} onClick={remove}>
        {busy ? "در حال حذف..." : label}
      </Button>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
