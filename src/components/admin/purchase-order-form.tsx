"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Alert, Card } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatToman } from "@/lib/money";
import { formatNumber } from "@/lib/persian";

export interface PurchaseVariantOption {
  id: string;
  label: string;
  sku: string;
  costPrice: number | null;
  supplierId: string | null;
  stock: number;
}

export interface EditablePurchaseOrder {
  id: string;
  supplierId: string;
  expectedAt: string | null;
  shippingCost: number;
  discountAmount: number;
  note: string | null;
  items: Array<{ variantId: string; quantity: number; unitCost: number; note: string | null }>;
}

interface Props {
  suppliers: Array<{ id: string; name: string }>;
  variants: PurchaseVariantOption[];
  order?: EditablePurchaseOrder;
}

interface Line {
  variantId: string;
  quantity: string;
  unitCost: string;
  note: string;
}

const blankLine = (): Line => ({ variantId: "", quantity: "1", unitCost: "", note: "" });

/** Convert an ISO date to the `YYYY-MM-DDTHH:mm` shape datetime-local expects. */
function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PurchaseOrderForm({ suppliers, variants, order }: Props) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState(order?.supplierId ?? suppliers[0]?.id ?? "");
  const [expectedAt, setExpectedAt] = useState(toLocalInput(order?.expectedAt ?? null));
  const [shippingCost, setShippingCost] = useState(String(order?.shippingCost ?? 0));
  const [discountAmount, setDiscountAmount] = useState(String(order?.discountAmount ?? 0));
  const [note, setNote] = useState(order?.note ?? "");
  const [lines, setLines] = useState<Line[]>(() => order?.items.length
    ? order.items.map((item) => ({
        variantId: item.variantId,
        quantity: String(item.quantity),
        unitCost: String(item.unitCost),
        note: item.note ?? "",
      }))
    : [blankLine()]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const variantMap = useMemo(() => new Map(variants.map((variant) => [variant.id, variant])), [variants]);
  const subtotal = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0), 0);
  const discount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const shipping = Math.max(0, Number(shippingCost) || 0);
  const total = subtotal - discount + shipping;

  const updateLine = (index: number, patch: Partial<Line>) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  const pickVariant = (index: number, variantId: string) => {
    const variant = variantMap.get(variantId);
    updateLine(index, {
      variantId,
      unitCost: variant?.costPrice !== null && variant?.costPrice !== undefined ? String(variant.costPrice) : lines[index].unitCost,
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const items = lines
        .filter((line) => line.variantId && Number(line.quantity) > 0)
        .map((line) => ({
          variantId: line.variantId,
          quantity: Number(line.quantity),
          unitCost: Number(line.unitCost) || 0,
          note: line.note || undefined,
        }));
      if (!items.length) throw new Error("حداقل یک قلم کالا با مقدار معتبر اضافه کنید");
      const response = await fetch(order ? `/api/admin/purchase-orders/${order.id}` : "/api/admin/purchase-orders", {
        method: order ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          supplierId,
          expectedAt: expectedAt ? new Date(expectedAt).toISOString() : undefined,
          shippingCost: shipping,
          discountAmount: discount,
          note: note || undefined,
          items,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ثبت سفارش خرید ناموفق بود");
      router.push(`/admin/inventory/purchase-orders/${order?.id ?? body.data.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطای ارتباطی");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card className="grid gap-4 p-5 md:grid-cols-3">
        <Field label="تأمین‌کننده" htmlFor="po-supplier">
          <Select id="po-supplier" required value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
            <option value="">انتخاب کنید</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </Select>
        </Field>
        <Field label="تاریخ تحویل مورد انتظار" htmlFor="po-expected" hint="اختیاری">
          <Input id="po-expected" type="datetime-local" dir="ltr" value={expectedAt} onChange={(event) => setExpectedAt(event.target.value)} />
        </Field>
        <Field label="هزینه حمل (تومان)" htmlFor="po-shipping">
          <Input id="po-shipping" type="number" dir="ltr" min={0} value={shippingCost} onChange={(event) => setShippingCost(event.target.value)} />
        </Field>
        <Field label="تخفیف تأمین‌کننده (تومان)" htmlFor="po-discount">
          <Input id="po-discount" type="number" dir="ltr" min={0} value={discountAmount} onChange={(event) => setDiscountAmount(event.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="توضیحات" htmlFor="po-note">
            <Textarea id="po-note" rows={2} value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)} placeholder="شرایط پرداخت، شماره فاکتور تأمین‌کننده…" />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">اقلام سفارش</h2>
            <p className="mt-1 text-[11px] text-ink/45">برای هر تنوع، مقدار و بهای خرید واحد را وارد کنید.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, blankLine()])}>
            <Plus className="h-4 w-4" />افزودن قلم
          </Button>
        </div>
        <div className="space-y-3">
          {lines.map((line, index) => {
            const variant = variantMap.get(line.variantId);
            const lineTotal = (Number(line.quantity) || 0) * (Number(line.unitCost) || 0);
            return (
              <div key={index} className="grid items-end gap-3 rounded-2xl border border-line/70 p-3 md:grid-cols-[1.6fr_90px_130px_1fr_auto]">
                <Field label="تنوع کالا" htmlFor={`po-line-variant-${index}`}>
                  <Select id={`po-line-variant-${index}`} value={line.variantId} onChange={(event) => pickVariant(index, event.target.value)}>
                    <option value="">انتخاب کنید</option>
                    {variants.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="تعداد" htmlFor={`po-line-qty-${index}`}>
                  <Input id={`po-line-qty-${index}`} type="number" dir="ltr" min={1} value={line.quantity} onChange={(event) => updateLine(index, { quantity: event.target.value })} />
                </Field>
                <Field label="بهای واحد" htmlFor={`po-line-cost-${index}`}>
                  <Input id={`po-line-cost-${index}`} type="number" dir="ltr" min={0} required value={line.unitCost} onChange={(event) => updateLine(index, { unitCost: event.target.value })} />
                </Field>
                <div className="text-[11px] text-ink/50">
                  {variant ? <span dir="ltr" className="block text-[10px] text-ink/40">{variant.sku} — موجودی {formatNumber(variant.stock)}</span> : null}
                  <span>جمع: <b dir="ltr">{formatToman(lineTotal)}</b></span>
                </div>
                <button type="button" aria-label="حذف قلم" disabled={lines.length === 1} onClick={() => setLines(lines.filter((_, lineIndex) => lineIndex !== index))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <dl className="grid gap-2 text-xs sm:grid-cols-4">
          <div><dt className="text-ink/45">جمع اقلام</dt><dd dir="ltr" className="font-semibold">{formatToman(subtotal)}</dd></div>
          <div><dt className="text-ink/45">تخفیف</dt><dd dir="ltr" className="font-semibold">{formatToman(discount)}</dd></div>
          <div><dt className="text-ink/45">حمل</dt><dd dir="ltr" className="font-semibold">{formatToman(shipping)}</dd></div>
          <div><dt className="text-ink/45">مبلغ نهایی</dt><dd dir="ltr" className="font-semibold text-primary">{formatToman(total)}</dd></div>
        </dl>
        <Button type="submit" disabled={busy}>{busy ? "در حال ذخیره..." : order ? "ذخیره تغییرات پیش‌نویس" : "ثبت پیش‌نویس سفارش خرید"}</Button>
      </Card>
      {message ? <Alert tone="error">{message}</Alert> : null}
    </form>
  );
}
