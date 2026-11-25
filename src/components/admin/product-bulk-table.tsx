"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/display";
import { formatToman } from "@/lib/money";
import { formatNumber } from "@/lib/persian";

export interface ProductRow {
  id: string; name: string; sku: string; status: string; basePrice: number; salePrice: number | null;
  availableStock: number; category: string; brand: string | null; variants: number;
}

const statusLabels: Record<string, string> = { DRAFT: "پیش‌نویس", ACTIVE: "فعال", INACTIVE: "غیرفعال", DISCONTINUED: "متوقف" };

export function ProductBulkTable({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState("status");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const allSelected = products.length > 0 && products.every((product) => selected.has(product.id));
  const ids = useMemo(() => [...selected], [selected]);

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const apply = async () => {
    if (!ids.length) return;
    const labels: Record<string, string> = { status: "تغییر وضعیت", price: "به‌روزرسانی قیمت", stock: "به‌روزرسانی موجودی", archive: "بایگانی", feature: "ویژه‌سازی" };
    if (!window.confirm(`${labels[action]} برای ${formatNumber(ids.length)} محصول انجام شود؟`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = { action, ids };
      if (action === "status") payload.status = status;
      if (action === "price") { payload.mode = value.startsWith("+") || value.startsWith("-") ? "percent" : "set"; payload.value = Number(value); }
      if (action === "stock") { payload.mode = value.startsWith("+") || value.startsWith("-") ? "increment" : "set"; payload.value = Number(value); }
      if (action === "feature") payload.isFeatured = true;
      const response = await fetch("/api/admin/products/bulk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "عملیات ناموفق بود");
      setMessage({ tone: "success", text: `${formatNumber(body.data.affected)} محصول به‌روزرسانی شد.` });
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="admin-panel flex flex-wrap items-end gap-2 p-3">
        <span className="text-xs text-ink/55">{formatNumber(selected.size)} انتخاب</span>
        <select className="field min-h-10 max-w-40 text-xs" value={action} onChange={(event) => setAction(event.target.value)} aria-label="عملیات گروهی">
          <option value="status">تغییر وضعیت</option>
          <option value="price">قیمت پایه</option>
          <option value="stock">موجودی همه تنوع‌ها</option>
          <option value="feature">افزودن به ویژه</option>
          <option value="archive">بایگانی</option>
        </select>
        {action === "status" ? (
          <select className="field min-h-10 max-w-36 text-xs" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="وضعیت جدید">
            {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        ) : action === "price" ? (
          <input className="field min-h-10 max-w-48 text-xs" dir="ltr" value={value} onChange={(event) => setValue(event.target.value)} placeholder="مبلغ یا +10 / -5 درصد" aria-label="مقدار قیمت" />
        ) : action === "stock" ? (
          <input className="field min-h-10 max-w-48 text-xs" dir="ltr" value={value} onChange={(event) => setValue(event.target.value)} placeholder="تعداد یا +10 / -5" aria-label="مقدار موجودی" />
        ) : null}
        <button type="button" onClick={apply} disabled={busy || !ids.length || ((action === "price" || action === "stock") && !value)} className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-primary px-4 text-xs text-white disabled:opacity-40">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}اجرا
        </button>
        {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      </div>

      <div className="table-wrap">
        <table className="table-luxury">
          <thead>
            <tr>
              <th className="w-10">
                <input type="checkbox" aria-label="انتخاب همه" checked={allSelected} onChange={(event) => setSelected(event.target.checked ? new Set(products.map((product) => product.id)) : new Set())} className="h-4 w-4 accent-[var(--color-primary)]" />
              </th>
              <th>محصول</th><th>دسته</th><th>قیمت</th><th>موجودی</th><th>تنوع</th><th>وضعیت</th><th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={selected.has(product.id) ? "bg-primary/5" : undefined}>
                <td><input type="checkbox" aria-label={`انتخاب ${product.name}`} checked={selected.has(product.id)} onChange={() => toggle(product.id)} className="h-4 w-4 accent-[var(--color-primary)]" /></td>
                <td>
                  <Link href={`/admin/products/${product.id}`} className="font-medium text-primary hover:underline">{product.name}</Link>
                  <p dir="ltr" className="mt-1 text-[10px] text-ink/45">{product.sku}</p>
                </td>
                <td className="text-xs">{product.category}</td>
                <td dir="ltr" className="text-xs">{formatToman(product.salePrice ?? product.basePrice)}</td>
                <td className={`text-xs ${product.availableStock <= 5 ? "font-semibold text-red-600" : ""}`}>{formatNumber(product.availableStock)}</td>
                <td className="text-xs">{formatNumber(product.variants)}</td>
                <td className="text-xs">{statusLabels[product.status]}</td>
                <td><Link href={`/admin/products/${product.id}`} className="text-xs text-primary underline">مدیریت</Link></td>
              </tr>
            ))}
            {!products.length ? <tr><td colSpan={8} className="py-10 text-center text-xs text-ink/45">محصولی یافت نشد.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
