"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Field, Input } from "@/components/ui/field";
import { formatJalali, formatNumber, isValidIranianPhone } from "@/lib/persian";

interface TrackResult {
  orderNumber: string;
  status: string;
  createdAt: string;
  estimatedDelivery: string | null;
  trackingNumber: string | null;
  statusHistory: { toStatus: string; createdAt: string; note: string | null }[];
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  PROCESSING: "در حال آمادهسازی",
  PACKED: "بستهبندی شده",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازپرداخت شده",
};

export function TrackForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "info" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidIranianPhone(phone)) {
      setMessage({ text: "شماره موبایل نامعتبر است", tone: "error" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), phone }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "سفارش یافت نشد");
      setResult(body.data);
    } catch (error) {
      setResult(null);
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="شماره سفارش" htmlFor="track-order">
            <Input id="track-order" dir="ltr" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ILK-..." />
          </Field>
          <Field label="شماره موبایل خریدار" htmlFor="track-phone">
            <Input id="track-phone" dir="ltr" inputMode="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" />
          </Field>
          <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={busy}>{busy ? "در حال جستجو..." : "پیگیری سفارش"}</Button></div>
        </form>
        {message ? <div className="mt-4"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
      </Card>

      {result ? (
        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-ink/55">شماره سفارش</p>
              <p dir="ltr" className="text-sm font-semibold text-primary">{result.orderNumber}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
              {statusLabels[result.status] ?? result.status}
            </span>
          </div>
          <div className="mb-6 grid gap-3 text-xs text-ink/65 sm:grid-cols-2">
            <p>تاریخ ثبت: {formatJalali(result.createdAt)}</p>
            <p>تحویل تخمینی: {result.estimatedDelivery ? formatJalali(result.estimatedDelivery) : "پس از پردازش"}</p>
            {result.trackingNumber ? <p dir="ltr">کد پیگیری: {result.trackingNumber}</p> : null}
          </div>
          <ol className="space-y-4 border-r-2 border-line pr-5">
            {result.statusHistory.map((item, index) => (
              <li key={index} className="relative">
                <span className="absolute -right-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
                <p className="text-sm font-medium">{statusLabels[item.toStatus] ?? item.toStatus}</p>
                <p className="text-xs text-ink/50">{formatJalali(item.createdAt)} {item.note ? `— ${item.note}` : ""}</p>
              </li>
            ))}
            {result.statusHistory.length === 0 ? <li className="text-sm text-ink/55">تاریخچهای ثبت نشده است.</li> : null}
          </ol>
          <p className="mt-6 text-xs text-ink/45">تعداد مراحل: {formatNumber(result.statusHistory.length)}</p>
        </Card>
      ) : null}
    </div>
  );
}
