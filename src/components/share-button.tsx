"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // The clipboard may be blocked; the URL remains visible in the address bar.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-xs text-ink/60 transition-colors hover:border-primary hover:text-primary"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "لینک کپی شد" : "اشتراک‌گذاری"}
    </button>
  );
}
