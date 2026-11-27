"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Card } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatNumber } from "@/lib/persian";

export interface ReceiveLine {
  id: string;
  label: string;
  sku: string;
  quantity: number;
  receivedQuantity: number;
  remaining: number;
  unitCost: number;
}

interface Props {
  orderId: string;
  status: string;
  hasReceived: boolean;
  lines: ReceiveLine[];
}

export function PurchaseOrderActions({ orderId, status, hasReceived, lines }: Props) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, string>>(() => Object.fromEntries(lines.map((line) => [line.id, "0"])));
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (url: string, body?: unknown) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message ?? "عملیات ناموفق بود");
      router.refresh();
      return payload;
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const receive = async (event: React.FormEvent) => {
    event.preventDefault();
    const items = Object.entries(quantities)
      .map(([itemId, quantity]) => ({ itemId, quantity: Number(quantity) || 0 }))
      .filter((item) => item.quantity > 0);
    if (!items.length) {
      setMessage({ text: "حداقل یک مقدار دریافتی وارد کنید", tone: "error" });
      return;
    }
    const result = await post(`/api/admin/purchase-orders/${orderId}/receive`, { items });
    if (result) setMessage({ text: "رسید انبار ثبت و موجودی به‌روزرسانی شد.", tone: "success" });
  };

  return (
    <div className="space-y-4">
      {["ORDERED", "PARTIAL"].includes(status) ? (
        <Card className="p-5">
          <h2 className="mb-1 text-sm font-semibold">رسید انبار</h2>
          <p className="mb-4 text-[11px] text-ink/45">مقادیر دریافت‌شده را وارد کنید؛ می‌توانید بخشی از سفارش را دریافت کنید.</p>
          <form onSubmit={receive} className="space-y-3">
            <div className="table-wrap">
              <table className="table-luxury min-w-[760px]">
                <thead><tr><th>کالا</th><th>سفارش</th><th>دریافت‌شده</th><th>باقی‌مانده</th><th>بهای واحد</th><th>دریافت جدید</th></tr></thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <span className="text-xs font-medium">{line.label}</span>
                        <span dir="ltr" className="mt-0.5 block text-[10px] text-ink/40">{line.sku}</span>
                      </td>
                      <td>{formatNumber(line.quantity)}</td>
                      <td>{formatNumber(line.receivedQuantity)}</td>
                      <td className="font-semibold">{formatNumber(line.remaining)}</td>
                      <td dir="ltr" className="text-[11px]">{formatNumber(line.unitCost)}</td>
                      <td>
                        <Input
                          aria-label={`دریافت ${line.label}`}
                          type="number"
                          dir="ltr"
                          min={0}
                          max={line.remaining}
                          disabled={line.remaining === 0}
                          value={quantities[line.id] ?? "0"}
                          onChange={(event) => setQuantities({ ...quantities, [line.id]: event.target.value })}
                          className="max-w-28"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy}>{busy ? "در حال ثبت..." : "ثبت رسید انبار"}</Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setQuantities(Object.fromEntries(lines.map((line) => [line.id, String(line.remaining)])))}
              >
                دریافت همه باقی‌مانده
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {status === "DRAFT" || (status === "ORDERED" && !hasReceived) ? (
        <Card className="flex flex-wrap items-center gap-2 p-4">
          {status === "DRAFT" ? (
            <Button type="button" disabled={busy} onClick={() => post(`/api/admin/purchase-orders/${orderId}/status`, { status: "ORDERED" })}>
              ثبت سفارش برای تأمین‌کننده
            </Button>
          ) : null}
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm("سفارش خرید لغو شود؟ این عملیات موجودی را تغییر نمی‌دهد.")) {
                void post(`/api/admin/purchase-orders/${orderId}/status`, { status: "CANCELLED" });
              }
            }}
          >
            لغو سفارش خرید
          </Button>
          {status === "DRAFT" ? <span className="text-[10px] text-ink/40">پس از ثبت، ویرایش اقلام قفل می‌شود.</span> : null}
        </Card>
      ) : null}

      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
    </div>
  );
}
