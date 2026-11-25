"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Field, Textarea } from "@/components/ui/field";

export function ReturnForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "ثبت درخواست ناموفق بود");
      setMessage({ text: "درخواست بازگشت ثبت شد.", tone: "success" });
      setReason("");
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-2 text-lg font-semibold">درخواست بازگشت کالا</h2>
      <p className="mb-5 text-xs text-ink/55">دلیل بازگشت را حداقل ۱۰ حرف وارد کنید.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="دلیل" htmlFor="return-reason"><Textarea id="return-reason" required minLength={10} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
        <Button type="submit" disabled={busy || reason.length < 10}>{busy ? "در حال ارسال..." : "ثبت درخواست"}</Button>
        {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      </form>
    </Card>
  );
}
