"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminModal, ConfirmButton } from "@/components/admin/admin-client";
import { Alert, Card } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { formatJalali, formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";

export type CrudFieldType = "text" | "textarea" | "number" | "select" | "checkbox" | "datetime" | "url" | "json";

export interface CrudField {
  key: string;
  label: string;
  type: CrudFieldType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  hint?: string;
  rows?: number;
  ltr?: boolean;
}

export interface CrudColumn {
  key: string;
  label: string;
  type?: "text" | "boolean" | "date" | "toman" | "number" | "code";
  labelMap?: Record<string, string>;
  maxWidth?: boolean;
}

function nested(item: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, item);
}

function toLocalInput(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function displayValue(value: unknown, column: CrudColumn): ReactNode {
  if (value === null || value === undefined || value === "") return "—";
  if (column.labelMap) return column.labelMap[String(value)] ?? String(value);
  if (column.type === "boolean") return value ? "بله" : "خیر";
  if (column.type === "date") return formatJalali(String(value), true);
  if (column.type === "toman") return formatToman(Number(value));
  if (column.type === "number") return formatNumber(Number(value));
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  return String(value);
}

type FormState = Record<string, string | boolean>;

export function AdminCrudManager({
  title,
  endpoint,
  fields,
  columns,
  items,
  idKey = "id",
  canCreate = true,
  canDelete = true,
  createLabel = "افزودن",
  editLabel = "ذخیره تغییرات",
  emptyText = "آیتمی یافت نشد.",
  viewHrefPrefix,
  extraActions,
  header,
  transformInitial,
  deletePath,
  wide = false,
  sendEndpointPrefix,
  sendLabel = "ارسال",
  sendBlockedWhen,
}: {
  title: string;
  endpoint: string;
  fields: CrudField[];
  columns: CrudColumn[];
  items: Array<Record<string, unknown>>;
  idKey?: string;
  canCreate?: boolean;
  canDelete?: boolean;
  createLabel?: string;
  editLabel?: string;
  emptyText?: string;
  viewHrefPrefix?: string;
  extraActions?: ReactNode;
  header?: ReactNode;
  transformInitial?: Record<string, unknown>;
  deletePath?: string;
  wide?: boolean;
  sendEndpointPrefix?: string;
  sendLabel?: string;
  sendBlockedWhen?: { key: string; value: string };
}) {
  const router = useRouter();
  const blank = (): FormState => Object.fromEntries(fields.map((field) => [
    field.key,
    field.type === "checkbox" ? Boolean(transformInitial?.[field.key] ?? false) : transformInitial?.[field.key] !== undefined ? String(transformInitial[field.key]) : "",
  ]));
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const startCreate = () => {
    setEditingId(null);
    setForm(blank());
    setMessage(null);
    setOpen(true);
  };

  const startEdit = (item: Record<string, unknown>) => {
    setEditingId(String(item[idKey]));
    setForm(Object.fromEntries(fields.map((field) => {
      const raw = nested(item, field.key);
      if (field.type === "checkbox") return [field.key, Boolean(raw)];
      if (field.type === "datetime") return [field.key, toLocalInput(raw)];
      if (field.type === "json") return [field.key, raw ? JSON.stringify(raw, null, 2) : ""];
      return [field.key, raw === null || raw === undefined ? "" : typeof raw === "object" ? JSON.stringify(raw) : String(raw)];
    })));
    setMessage(null);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = form[field.key];
        if (field.type === "checkbox") { payload[field.key] = Boolean(raw); continue; }
        if (typeof raw !== "string") continue;
        const trimmed = raw.trim();
        if (!trimmed) {
          if (field.required) throw new Error(`${field.label} الزامی است`);
          continue;
        }
        if (field.type === "number") payload[field.key] = Number(trimmed);
        else if (field.type === "datetime") payload[field.key] = new Date(trimmed).toISOString();
        else if (field.type === "json") {
          try { payload[field.key] = JSON.parse(trimmed); }
          catch { throw new Error(`${field.label} باید JSON معتبر باشد`); }
        } else payload[field.key] = trimmed;
      }
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "عملیات ناموفق بود");
      setMessage({ text: editingId ? "تغییرات ذخیره شد." : "آیتم ایجاد شد.", tone: "success" });
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("آیا از حذف این آیتم اطمینان دارید؟ این عمل بازگشت‌ناپذیر است.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${deletePath ?? endpoint}/${id}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "حذف ناموفق بود");
      setMessage({ text: "آیتم حذف شد.", tone: "success" });
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          {canCreate ? <Button type="button" size="sm" onClick={startCreate}><Plus className="h-4 w-4" />{createLabel}</Button> : null}
        </div>
      </div>
      {header}
      <Card className="overflow-hidden">
        <div className="table-wrap border-0">
          <table className="table-luxury">
            <thead>
              <tr>
                {columns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const id = String(item[idKey]);
                return (
                  <tr key={id}>
                    {columns.map((column) => {
                      const value = nested(item, column.key);
                      return (
                        <td key={column.key} className={column.maxWidth ? "max-w-52 truncate" : undefined}>
                          {column.type === "code" ? <span dir="ltr" className="text-[10px] text-ink/50">{displayValue(value, column)}</span> : displayValue(value, column)}
                        </td>
                      );
                    })}
                    <td>
                      <div className="flex items-center gap-1">
                        {viewHrefPrefix ? <Link href={`${viewHrefPrefix}${id}`} className="inline-flex h-9 items-center rounded-lg px-2 text-[11px] text-primary hover:bg-primary/10">مشاهده</Link> : null}
                        {sendEndpointPrefix && !(sendBlockedWhen && String(item[sendBlockedWhen.key]) === sendBlockedWhen.value) ? (
                          <ConfirmButton endpoint={`${sendEndpointPrefix}/${id}/send`} method="POST" label={sendLabel} confirmText="ارسال این کمپین انجام شود؟ پیام فقط برای گیرندگان دارای رضایت ارسال می‌شود." variant="outline" size="sm" />
                        ) : null}
                        <button type="button" onClick={() => startEdit(item)} aria-label="ویرایش" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-line/60"><Pencil className="h-4 w-4" /></button>
                        {canDelete ? <button type="button" onClick={() => remove(id)} disabled={busy} aria-label="حذف" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!items.length ? <tr><td colSpan={columns.length + 1} className="py-10 text-center text-xs text-ink/45">{emptyText}</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      {message && !open ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <AdminModal open={open} onClose={() => setOpen(false)} title={editingId ? `ویرایش ${title}` : createLabel} wide={wide}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.type === "textarea" || field.type === "json" ? "sm:col-span-2" : undefined}>
              <Field label={field.label} htmlFor={`crud-${field.key}`} hint={field.hint}>
                {field.type === "textarea" ? (
                  <Textarea id={`crud-${field.key}`} rows={field.rows ?? 5} required={field.required} placeholder={field.placeholder}
                    value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />
                ) : field.type === "json" ? (
                  <Textarea id={`crud-${field.key}`} rows={field.rows ?? 8} dir="ltr" required={field.required} placeholder={field.placeholder}
                    value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />
                ) : field.type === "select" ? (
                  <Select id={`crud-${field.key}`} required={field.required} value={String(form[field.key] ?? "")}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}>
                    <option value="">انتخاب کنید</option>
                    {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                ) : field.type === "checkbox" ? (
                  <label className="flex min-h-11 items-center gap-2 text-sm text-ink/70">
                    <Checkbox checked={Boolean(form[field.key])} onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })} />فعال
                  </label>
                ) : (
                  <Input id={`crud-${field.key}`} type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : "text"}
                    dir={field.ltr || field.type === "number" || field.type === "datetime" ? "ltr" : undefined}
                    required={field.required} placeholder={field.placeholder}
                    value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />
                )}
              </Field>
            </div>
          ))}
          <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm text-ink/60 hover:bg-line/60">لغو</button>
            <Button type="submit" size="sm" disabled={busy}>{busy ? "در حال ذخیره…" : editingId ? editLabel : createLabel}</Button>
          </div>
          {message ? <div className="sm:col-span-2"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
        </form>
      </AdminModal>
    </div>
  );
}
