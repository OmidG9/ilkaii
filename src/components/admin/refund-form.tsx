"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Field, Input, Textarea } from "@/components/ui/field";
import { formatNumber } from "@/lib/persian";

export function RefundForm({ orderId, remainingRefundable }: { orderId: string; remainingRefundable: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(remainingRefundable);
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (remainingRefundable <= 0) {
    return (
      <Card className="p-6 text-sm text-ink/60">
        این سفارش به‌طور کامل بازپرداخت شده است.
      </Card>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!Number.isFinite(amount) || amount < 1 || amount > remainingRefundable) {
      setMessage({ tone: "error", text: `مبلغ باید بین ۱ و ${formatNumber(remainingRefundable)} تومان باشد.` });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refunds`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount),
          reference: reference.trim() || undefined,
          reason: reason.trim() || undefined,
          status: "COMPLETED",
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ثبت بازپرداخت ناموفق بود");
      setMessage({ tone: "success", text: "بازپرداخت در دفتر ثبت شد." });
      setReference("");
      setReason("");
      setAmount(0);
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-2 text-lg font-semibold">ثبت بازپرداخت</h2>
      <p className="mb-5 text-xs leading-6 text-ink/55">
        بازپرداخت بانکی را ابتدا در پنل درگاه انجام دهید، سپس مبلغ و مرجع آن را اینجا ثبت کنید. این فرم فقط دفتر
        بازپرداخت را به‌روزرسانی می‌کند.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="مبلغ (تومان)" htmlFor="refund-amount" hint={`حداکثر ${formatNumber(remainingRefundable)} تومان`}>
          <Input
            id="refund-amount"
            type="number"
            dir="ltr"
            min={1}
            max={remainingRefundable}
            required
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </Field>
        <Field label="مرجع بانکی (اختیاری)" htmlFor="refund-reference">
          <Input
            id="refund-reference"
            dir="ltr"
            maxLength={191}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="شماره پیگیری/مرجع"
          />
        </Field>
        <Field label="توضیح (اختیاری)" htmlFor="refund-reason">
          <Textarea
            id="refund-reason"
            maxLength={2000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy}>{busy ? "در حال ثبت..." : "ثبت بازپرداخت"}</Button>
        {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      </form>
    </Card>
  );
}
