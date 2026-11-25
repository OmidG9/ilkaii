"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

export function OrderStatusForm({ orderId, currentStatus, transitions, labels }: {
  orderId: string;
  currentStatus: string;
  transitions: string[];
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(transitions[0] ?? "");
  const [note, setNote] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, note: note || undefined, trackingNumber: trackingNumber || undefined }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "تغییر وضعیت ناموفق بود");
      setMessage({ text: "وضعیت سفارش بهروز شد.", tone: "success" });
      setNote("");
      setTrackingNumber("");
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-2 text-lg font-semibold">تغییر وضعیت</h2>
      <p className="mb-5 text-xs text-ink/55">وضعیت فعلی: {labels[currentStatus] ?? currentStatus}</p>
      {transitions.length ? (
        <form onSubmit={submit} className="space-y-4">
          <Field label="وضعیت جدید" htmlFor="os-status">
            <Select id="os-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {transitions.map((item) => <option key={item} value={item}>{labels[item] ?? item}</option>)}
            </Select>
          </Field>
          <Field label="کد پیگیری (اختیاری)" htmlFor="os-tracking">
            <Input id="os-tracking" dir="ltr" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="IR..." />
          </Field>
          <Field label="یادداشت (اختیاری)" htmlFor="os-note">
            <Textarea id="os-note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Button type="submit" disabled={busy || !status}>{busy ? "در حال بهروزرسانی..." : "اعمال تغییر"}</Button>
          {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
        </form>
      ) : (
        <Alert>این سفارش در وضعیت نهایی قرار دارد و قابل تغییر نیست.</Alert>
      )}
    </Card>
  );
}
