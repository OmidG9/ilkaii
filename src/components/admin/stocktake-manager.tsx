"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatNumber } from "@/lib/persian";

interface CategoryOption {
  id: string;
  name: string;
}

export function StocktakeCreateForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [scope, setScope] = useState("ALL");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/stocktakes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope,
          ...(scope === "CATEGORY" ? { categoryId } : {}),
          note: note || undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ایجاد انبارگردانی ناموفق بود");
      router.push(`/admin/inventory/stocktakes/${body.data.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطای ارتباطی");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid items-end gap-3 md:grid-cols-[200px_200px_1fr_auto]">
      <Field label="دامنه شمارش" htmlFor="st-scope">
        <Select id="st-scope" value={scope} onChange={(event) => setScope(event.target.value)}>
          <option value="ALL">همه کالاها</option>
          <option value="LOW_STOCK">فقط موجودی کم</option>
          <option value="CATEGORY">یک دسته‌بندی</option>
        </Select>
      </Field>
      {scope === "CATEGORY" ? (
        <Field label="دسته‌بندی" htmlFor="st-category">
          <Select id="st-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
        </Field>
      ) : <div className="hidden md:block" />}
      <Field label="توضیح" htmlFor="st-note">
        <Textarea id="st-note" rows={1} value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="مثلاً شمارش پایان ماه" />
      </Field>
      <Button type="submit" disabled={busy}>{busy ? "در حال ایجاد..." : "شروع انبارگردانی"}</Button>
      {message ? <div className="md:col-span-4"><Alert tone="error">{message}</Alert></div> : null}
    </form>
  );
}

export interface StocktakeItemRow {
  id: string;
  expectedQuantity: number;
  countedQuantity: number | null;
  difference: number | null;
  currentStock: number;
  variant: {
    id: string;
    sku: string;
    barcode: string | null;
    location: string | null;
    size: string;
    color: string | null;
    product: { id: string; name: string };
  };
}

export function StocktakeCountForm({ stocktakeId, items, disabled }: { stocktakeId: string; items: StocktakeItemRow[]; disabled: boolean }) {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, string>>(() => Object.fromEntries(
    items.map((item) => [item.id, item.countedQuantity === null ? "" : String(item.countedQuantity)]),
  ));
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = Object.entries(counts)
      .filter(([, value]) => value !== "")
      .map(([itemId, value]) => ({ itemId, countedQuantity: Number(value) }));
    if (!payload.length) {
      setMessage({ text: "حداقل یک شمارش وارد کنید", tone: "error" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/stocktakes/${stocktakeId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ counts: payload }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره شمارش ناموفق بود");
      setMessage({ text: "شمارش‌ها ذخیره شد.", tone: "success" });
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="table-wrap">
        <table className="table-luxury min-w-[700px]">
          <thead><tr><th>کالا</th><th>SKU / بارکد</th><th>موجودی سیستم</th><th>موجودی فعلی</th><th>شمارش شده</th><th>مغایرت</th></tr></thead>
          <tbody>
            {items.map((item) => {
              const value = counts[item.id] ?? "";
              const difference = value === "" ? null : Number(value) - item.expectedQuantity;
              return (
                <tr key={item.id}>
                  <td>
                    <span className="text-xs font-medium">{item.variant.product.name}</span>
                    <p className="mt-0.5 text-[10px] text-ink/45">{item.variant.size}{item.variant.color ? ` / ${item.variant.color}` : ""}</p>
                  </td>
                  <td dir="ltr" className="text-[11px]">
                    <span className="block">{item.variant.sku}</span>
                    {item.variant.barcode ? <span className="block text-[10px] text-ink/40">{item.variant.barcode}</span> : null}
                  </td>
                  <td>{formatNumber(item.expectedQuantity)}</td>
                  <td>{formatNumber(item.currentStock)}</td>
                  <td>
                    <Input
                      aria-label={`شمارش ${item.variant.sku}`}
                      type="number"
                      dir="ltr"
                      min={0}
                      disabled={disabled}
                      value={value}
                      onChange={(event) => setCounts({ ...counts, [item.id]: event.target.value })}
                      className="max-w-28"
                    />
                  </td>
                  <td dir="ltr" className={difference === null ? "text-ink/40" : difference === 0 ? "text-emerald-700" : difference > 0 ? "text-sky-700" : "text-red-600"}>
                    {difference === null ? "—" : `${difference > 0 ? "+" : ""}${formatNumber(difference)}`}
                  </td>
                </tr>
              );
            })}
            {!items.length ? <tr><td colSpan={6} className="py-8 text-center text-ink/50">قلمی برای شمارش یافت نشد.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {!disabled ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy}>{busy ? "در حال ذخیره..." : "ذخیره شمارش این صفحه"}</Button>
          <span className="text-[10px] text-ink/40">شمارش‌ها تا زمان تکمیل انبارگردانی موجودی را تغییر نمی‌دهند.</span>
        </div>
      ) : null}
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
    </form>
  );
}

export function StocktakeActions({ stocktakeId, status }: { stocktakeId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);

  const run = async (action: "complete" | "cancel") => {
    if (action === "complete" && !window.confirm("تکمیل انبارگردانی، مغایرت‌ها را روی موجودی اعمال می‌کند. ادامه می‌دهید؟")) return;
    if (action === "cancel" && !window.confirm("انبارگردانی لغو شود؟ شمارش‌های ذخیره‌شده اعمال نمی‌شوند.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(
        action === "complete" ? `/api/admin/stocktakes/${stocktakeId}/complete` : `/api/admin/stocktakes/${stocktakeId}/status`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: action === "cancel" ? JSON.stringify({ status: "CANCELLED" }) : "{}",
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "عملیات ناموفق بود");
      if (action === "complete") {
        setMessage({ text: `تکمیل شد؛ ${formatNumber(body?.data?.adjusted ?? 0)} قلم اصلاح و ${formatNumber(body?.data?.movedUnits ?? 0)} واحد جابه‌جا شد.`, tone: "success" });
      }
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (!["DRAFT", "IN_PROGRESS"].includes(status)) {
    return message ? <Alert tone={message.tone}>{message.text}</Alert> : null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={busy} onClick={() => run("complete")}>{busy ? "در حال پردازش..." : "تکمیل و اعمال مغایرت‌ها"}</Button>
        <Button type="button" variant="danger" disabled={busy} onClick={() => run("cancel")}>لغو انبارگردانی</Button>
      </div>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
    </div>
  );
}
