"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/display";
import { Input } from "@/components/ui/field";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  return (
    <form onSubmit={async (event) => {
      event.preventDefault();
      setBusy(true);
      setMessage(null);
      try {
        const response = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, source: "footer" }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error?.message ?? "ثبت ایمیل ناموفق بود");
        setMessage({ tone: "success", text: "ثبت شد؛ پس از تأیید، عضویت شما فعال می‌شود." });
        setEmail("");
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
      } finally { setBusy(false); }
    }} className={compact ? "space-y-2" : "mt-3 space-y-2"}>
      <label htmlFor="newsletter-email" className="sr-only">ایمیل خبرنامه</label>
      <div className="flex gap-2">
        <Input id="newsletter-email" type="email" required dir="ltr" placeholder="email@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 text-xs" />
        <Button type="submit" size="sm" disabled={busy}>{busy ? "…" : "عضویت"}</Button>
      </div>
      {message ? <Alert tone={message.tone === "success" ? "success" : "error"}>{message.text}</Alert> : null}
    </form>
  );
}
