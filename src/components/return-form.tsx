"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { formatNumber } from "@/lib/persian";

export interface ReturnableItem {
  id: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  returnable: number;
}

export function ReturnForm({ orderId, items }: { orderId: string; items: ReturnableItem[] }) {
  const router = useRouter();
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const available = items.filter((item) => item.returnable > 0);
  if (!available.length) {
    return (
      <Card className="p-6 text-sm text-ink/60">
        همهٔ اقلام این سفارش قبلاً مرجوع شده یا درخواست بازگشت آن‌ها ثبت شده است.
      </Card>
    );
  }

  const selectedItems = available
    .map((item) => ({ id: item.id, quantity: selections[item.id] ?? 0 }))
    .filter((item) => item.quantity > 0);

  const toggle = (item: ReturnableItem, checked: boolean) => {
    setSelections((current) => {
      const next = { ...current };
      if (checked) next[item.id] = 1;
      else delete next[item.id];
      return next;
    });
  };

  const setQuantity = (item: ReturnableItem, quantity: number) => {
    const capped = Math.max(1, Math.min(item.returnable, Number.isFinite(quantity) ? Math.floor(quantity) : 1));
    setSelections((current) => ({ ...current, [item.id]: capped }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    if (!selectedItems.length) {
      setMessage({ text: "حداقل یک قلم کالا را برای بازگشت انتخاب کنید.", tone: "error" });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, reason, items: selectedItems }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ثبت درخواست ناموفق بود");
      setMessage({ text: "درخواست بازگشت ثبت شد.", tone: "success" });
      setSelections({});
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
      <p className="mb-5 text-xs leading-6 text-ink/55">
        کالاها و تعداد مورد نظر را انتخاب کنید. برای هر قلم، حداکثر تعداد قابل بازگشت نمایش داده می‌شود.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => {
            const disabled = item.returnable <= 0;
            const checked = (selections[item.id] ?? 0) > 0;
            return (
              <div key={item.id} className={`rounded-2xl border border-line p-4 ${disabled ? "opacity-55" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onChange={(event) => toggle(item, event.target.checked)}
                    />
                    <span>
                      <span className="block text-sm font-medium">{item.productName}</span>
                      <span className="mt-1 block text-xs text-ink/50">
                        {item.variantName ? `${item.variantName} — ` : ""}
                        خریداری‌شده: {formatNumber(item.quantity)} عدد
                      </span>
                      <span className="mt-1 block text-[10px] text-ink/40">
                        {disabled ? "قبلاً درخواست بازگشت ثبت شده است" : `قابل بازگشت: ${formatNumber(item.returnable)} عدد`}
                      </span>
                    </span>
                  </label>
                  {checked ? (
                    <label className="flex items-center gap-2 text-xs text-ink/60">
                      تعداد
                      <Input
                        type="number"
                        dir="ltr"
                        min={1}
                        max={item.returnable}
                        value={selections[item.id] ?? 1}
                        onChange={(event) => setQuantity(item, Number(event.target.value))}
                        className="h-10 w-20 text-center"
                        aria-label={`تعداد بازگشت ${item.productName}`}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        <Field label="دلیل بازگشت" htmlFor="return-reason" hint="حداقل ۱۰ حرف">
          <Textarea
            id="return-reason"
            required
            minLength={10}
            maxLength={2000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <Button type="submit" disabled={busy || reason.length < 10 || !selectedItems.length}>
          {busy ? "در حال ارسال..." : "ثبت درخواست"}
        </Button>
        {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      </form>
    </Card>
  );
}
