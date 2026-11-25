"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";

export function MaintenanceButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" disabled={busy} onClick={async () => {
        if (!window.confirm("وظیفه نگهداری اکنون اجرا شود؟")) return;
        setBusy(true);
        setMessage(null);
        try {
          const response = await fetch("/api/admin/system/maintenance", { method: "POST" });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body?.error?.message ?? "اجرای وظیفه ناموفق بود");
          setMessage("وظیفه نگهداری با موفقیت اجرا شد.");
          router.refresh();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "خطای ارتباطی");
        } finally { setBusy(false); }
      }} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-primary px-4 text-sm text-white disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}اجرای نگهداری
      </button>
      {message ? <span className="text-[10px] text-ink/50">{message}</span> : null}
    </span>
  );
}
