"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Settings2, Warehouse } from "lucide-react";
import { Alert, Badge } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { formatToman } from "@/lib/money";
import { formatNumber } from "@/lib/persian";
import type { InventoryStockFilter } from "@/services/warehouse";

export interface InventoryRowView {
  id: string;
  sku: string;
  barcode: string | null;
  location: string | null;
  size: string;
  color: string | null;
  stock: number;
  lowStockThreshold: number;
  costPrice: number | null;
  retailPrice: number;
  costValue: number;
  retailValue: number;
  isAvailable: boolean;
  supplierId: string | null;
  supplierName: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string;
  stockStatus: InventoryStockFilter;
}

interface Props {
  rows: InventoryRowView[];
  suppliers: Array<{ id: string; name: string }>;
}

type OpenPanel = { id: string; mode: "stock" | "settings" } | null;

function statusBadge(row: InventoryRowView) {
  if (!row.isAvailable) return <Badge tone="neutral">غیرفعال</Badge>;
  if (row.stock === 0) return <Badge tone="danger">ناموجود</Badge>;
  if (row.stock <= row.lowStockThreshold) return <Badge tone="danger">کم</Badge>;
  return <Badge tone="success">مناسب</Badge>;
}

export function InventoryStockTable({ rows, suppliers }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState<OpenPanel>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string, mode: "stock" | "settings") => {
    setOpen((current) => current?.id === id && current.mode === mode ? null : { id, mode });
  };

  const toggleSelect = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((current) => current.size === rows.length ? new Set() : new Set(rows.map((row) => row.id)));
  };

  return (
    <div>
      {selected.size ? <BulkAdjustBar ids={[...selected]} onDone={() => { setSelected(new Set()); router.refresh(); }} /> : null}
      <div className="table-wrap">
      <table className="table-luxury min-w-[1020px]">
        <thead>
          <tr>
            <th className="w-10">
              <input
                type="checkbox"
                aria-label="انتخاب همه"
                className="h-4 w-4 accent-[var(--color-primary)]"
                checked={rows.length > 0 && selected.size === rows.length}
                onChange={toggleAll}
              />
            </th>
            <th>محصول / تنوع</th>
            <th>SKU / بارکد</th>
            <th>قفسه</th>
            <th>موجودی</th>
            <th>آستانه</th>
            <th>بهای خرید</th>
            <th>قیمت فروش</th>
            <th>ارزش موجودی</th>
            <th>وضعیت</th>
            <th>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const panel = open?.id === row.id ? open.mode : null;
            return (
              <Fragment key={row.id}>
                <tr className={panel || selected.has(row.id) ? "bg-primary/5" : undefined}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`انتخاب ${row.sku}`}
                      className="h-4 w-4 accent-[var(--color-primary)]"
                      checked={selected.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                    />
                  </td>
                  <td>
                    <Link href={`/admin/products/${row.productId}`} className="text-xs font-medium text-primary hover:underline">{row.productName}</Link>
                    <p className="mt-0.5 text-[10px] text-ink/45">{row.categoryName} — {row.size}{row.color ? ` / ${row.color}` : ""}</p>
                  </td>
                  <td dir="ltr" className="text-[11px]">
                    <span className="block">{row.sku}</span>
                    {row.barcode ? <span className="block text-[10px] text-ink/40">{row.barcode}</span> : null}
                  </td>
                  <td dir="ltr" className="text-[11px] text-ink/60">{row.location ?? "—"}</td>
                  <td>
                    <span className={`text-sm font-semibold ${row.stock === 0 ? "text-red-600" : row.stock <= row.lowStockThreshold ? "text-amber-600" : "text-ink"}`}>
                      {formatNumber(row.stock)}
                    </span>
                  </td>
                  <td className="text-xs text-ink/55">{formatNumber(row.lowStockThreshold)}</td>
                  <td dir="ltr" className="text-[11px] text-ink/60">{row.costPrice === null ? "—" : formatToman(row.costPrice, false)}</td>
                  <td dir="ltr" className="text-[11px]">{formatToman(row.retailPrice, false)}</td>
                  <td dir="ltr" className="text-[11px] text-ink/60">{formatToman(row.costValue, false)}</td>
                  <td>{statusBadge(row)}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1">
                      <button type="button" onClick={() => toggle(row.id, "stock")} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line px-2 text-[11px] hover:border-primary" aria-expanded={panel === "stock"}>
                        <Warehouse className="h-3.5 w-3.5" />موجودی
                        {panel === "stock" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      <button type="button" onClick={() => toggle(row.id, "settings")} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line px-2 text-[11px] hover:border-primary" aria-expanded={panel === "settings"}>
                        <Settings2 className="h-3.5 w-3.5" />تنظیمات
                        {panel === "settings" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                    {row.supplierName ? <p className="mt-1 text-[10px] text-ink/40">تأمین‌کننده: {row.supplierName}</p> : null}
                  </td>
                </tr>
                {panel ? (
                  <tr className="bg-primary/[0.03]">
                    <td colSpan={11} className="p-4">
                      {panel === "stock"
                        ? <StockForm row={row} onDone={() => { setOpen(null); router.refresh(); }} />
                        : <VariantSettingsForm row={row} suppliers={suppliers} onDone={() => { setOpen(null); router.refresh(); }} />}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
          {!rows.length ? (
            <tr><td colSpan={11} className="py-10 text-center text-ink/50">کالایی با این فیلترها یافت نشد.</td></tr>
          ) : null}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function BulkAdjustBar({ ids, onDone }: { ids: string[]; onDone: () => void }) {
  const [mode, setMode] = useState("increment");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("RESTOCK");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/inventory/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids,
          mode,
          quantity: Number(quantity),
          reason,
          note: note || undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "به‌روزرسانی گروهی ناموفق بود");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطای ارتباطی");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid items-end gap-3 border-b border-line bg-primary/[0.04] p-4 md:grid-cols-[160px_150px_170px_1fr_auto]">
      <p className="self-center text-xs font-medium text-primary md:col-span-5">{formatNumber(ids.length)} تنوع انتخاب شده است.</p>
      <Field label="حالت" htmlFor="bulk-mode">
        <Select id="bulk-mode" value={mode} onChange={(event) => {
          const nextMode = event.target.value;
          setMode(nextMode);
          if (nextMode === "set" && reason === "RESTOCK") setReason("ADJUSTMENT");
        }}>
          <option value="increment">افزایش/کاهش</option>
          <option value="set">تنظیم مطلق</option>
        </Select>
      </Field>
      <Field label="مقدار" htmlFor="bulk-qty">
        <Input id="bulk-qty" type="number" dir="ltr" required value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder={mode === "increment" ? "+10 / -2" : "10"} />
      </Field>
      <Field label="دلیل" htmlFor="bulk-reason">
        <Select id="bulk-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
          <option value="RESTOCK">شارژ موجودی</option>
          <option value="ADJUSTMENT">تنظیم دستی</option>
          <option value="DAMAGE">ضایعات / آسیب</option>
        </Select>
      </Field>
      <Field label="توضیح" htmlFor="bulk-note">
        <Input id="bulk-note" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="اختیاری" />
      </Field>
      <Button type="submit" size="sm" disabled={busy}>{busy ? "در حال اعمال..." : "اعمال روی انتخاب"}</Button>
      {message ? <div className="md:col-span-5"><Alert tone="error">{message}</Alert></div> : null}
    </form>
  );
}

function StockForm({ row, onDone }: { row: InventoryRowView; onDone: () => void }) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("RESTOCK");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId: row.id, quantity: Number(quantity), reason, note: note || undefined }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ثبت تغییر موجودی ناموفق بود");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطای ارتباطی");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid items-end gap-3 md:grid-cols-[150px_170px_1fr_auto]">
      <Field label="تغییر موجودی" htmlFor={`stock-qty-${row.id}`} hint="مثبت = افزایش، منفی = کاهش">
        <Input id={`stock-qty-${row.id}`} type="number" dir="ltr" required value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="+10" />
      </Field>
      <Field label="دلیل" htmlFor={`stock-reason-${row.id}`}>
        <Select id={`stock-reason-${row.id}`} value={reason} onChange={(event) => setReason(event.target.value)}>
          <option value="RESTOCK">شارژ موجودی</option>
          <option value="ADJUSTMENT">تنظیم دستی</option>
          <option value="RETURN">بازگشت کالا</option>
          <option value="DAMAGE">ضایعات / آسیب</option>
        </Select>
      </Field>
      <Field label="توضیح" htmlFor={`stock-note-${row.id}`}>
        <Input id={`stock-note-${row.id}`} value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="اختیاری" />
      </Field>
      <div className="flex items-center gap-2 pb-0.5">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "در حال ثبت..." : "ثبت"}</Button>
        <span className="text-[10px] text-ink/45">موجودی فعلی: {formatNumber(row.stock)}</span>
      </div>
      {message ? <div className="md:col-span-4"><Alert tone="error">{message}</Alert></div> : null}
    </form>
  );
}

function VariantSettingsForm({ row, suppliers, onDone }: { row: InventoryRowView; suppliers: Array<{ id: string; name: string }>; onDone: () => void }) {
  const [form, setForm] = useState({
    barcode: row.barcode ?? "",
    location: row.location ?? "",
    costPrice: row.costPrice === null ? "" : String(row.costPrice),
    lowStockThreshold: String(row.lowStockThreshold),
    isAvailable: row.isAvailable,
    supplierId: row.supplierId ?? "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/inventory/variants/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          barcode: form.barcode.trim() || null,
          location: form.location.trim() || null,
          costPrice: form.costPrice === "" ? null : Number(form.costPrice),
          lowStockThreshold: Number(form.lowStockThreshold),
          isAvailable: form.isAvailable,
          supplierId: form.supplierId || null,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره تنظیمات ناموفق بود");
      onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "خطای ارتباطی");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid items-end gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Field label="بارکد" htmlFor={`barcode-${row.id}`}><Input id={`barcode-${row.id}`} dir="ltr" value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} /></Field>
      <Field label="قفسه / محل" htmlFor={`location-${row.id}`}><Input id={`location-${row.id}`} dir="ltr" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="A-12" /></Field>
      <Field label="بهای خرید (تومان)" htmlFor={`cost-${row.id}`}><Input id={`cost-${row.id}`} type="number" dir="ltr" min={0} value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} /></Field>
      <Field label="آستانه هشدار" htmlFor={`threshold-${row.id}`}><Input id={`threshold-${row.id}`} type="number" dir="ltr" min={0} value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} /></Field>
      <Field label="تأمین‌کننده پیش‌فرض" htmlFor={`supplier-${row.id}`}>
        <Select id={`supplier-${row.id}`} value={form.supplierId} onChange={(event) => setForm({ ...form, supplierId: event.target.value })}>
          <option value="">بدون تأمین‌کننده</option>
          {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
        </Select>
      </Field>
      <div className="space-y-2">
        <label className="flex min-h-11 items-center gap-2 text-xs">
          <Checkbox checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} />
          قابل فروش
        </label>
        <Button type="submit" size="sm" className="w-full" disabled={busy}>{busy ? "در حال ذخیره..." : "ذخیره تنظیمات"}</Button>
      </div>
      {message ? <div className="md:col-span-3 xl:col-span-6"><Alert tone="error">{message}</Alert></div> : null}
    </form>
  );
}
