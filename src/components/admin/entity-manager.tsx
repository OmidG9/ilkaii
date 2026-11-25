"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";

export type EntityFieldType = "text" | "textarea" | "number" | "select" | "checkbox" | "datetime";

export interface EntityField {
  key: string;
  label: string;
  type: EntityFieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hideOnEdit?: boolean;
}

export interface EntityColumn {
  key: string;
  label: string;
  ltr?: boolean;
}

interface Props {
  endpoint: string;
  idKey?: string;
  fields: EntityField[];
  columns: EntityColumn[];
  items: Array<Record<string, unknown>>;
  canCreate?: boolean;
  canDelete?: boolean;
  createLabel?: string;
  hideTable?: boolean;
}

type FormState = Record<string, string | boolean>;

function nested(item: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, item);
}

function display(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Convert an ISO date into the `YYYY-MM-DDTHH:mm` shape datetime-local expects. */
function toLocalInput(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toEntityRows<T extends object>(items: T[]): Array<Record<string, unknown>> {
  return items as unknown as Array<Record<string, unknown>>;
}

export function EntityManager({
  endpoint,
  idKey = "id",
  fields,
  columns,
  items,
  canCreate = true,
  canDelete = true,
  createLabel = "افزودن",
  hideTable = false,
}: Props) {
  const router = useRouter();
  const blank = (): FormState => Object.fromEntries(
    fields.map((field) => [field.key, field.type === "checkbox" ? true : ""]),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const startEdit = (item: Record<string, unknown>) => {
    setEditingId(String(item[idKey]));
    setForm(Object.fromEntries(fields.map((field) => {
      const value = item[field.key];
      if (field.type === "checkbox") return [field.key, Boolean(value)];
      if (field.type === "datetime") return [field.key, toLocalInput(value)];
      return [field.key, value === null || value === undefined ? "" : String(value)];
    })));
    setMessage(null);
  };

  const cancel = () => {
    setEditingId(null);
    setForm(blank());
    setMessage(null);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of fields) {
        if (editingId && field.hideOnEdit) continue;
        const raw = form[field.key];
        if (field.type === "checkbox") {
          payload[field.key] = Boolean(raw);
          continue;
        }
        if (typeof raw !== "string" || raw.trim() === "") continue;
        if (field.type === "number") payload[field.key] = Number(raw);
        else if (field.type === "datetime") payload[field.key] = new Date(raw).toISOString();
        else payload[field.key] = raw.trim();
      }
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "عملیات ناموفق بود");
      setMessage({ text: editingId ? "تغییرات ذخیره شد." : "آیتم اضافه شد.", tone: "success" });
      cancel();
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("آیا از حذف این آیتم اطمینان دارید؟")) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
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
    <div className={hideTable ? "max-w-2xl" : "grid gap-6 xl:grid-cols-[360px_1fr]"}>
      <Card className="h-fit p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{editingId ? "ویرایش" : createLabel}</h2>
          {editingId ? (
            <Button type="button" variant="ghost" size="sm" onClick={cancel}>لغو</Button>
          ) : null}
        </div>
        <form onSubmit={submit} className="space-y-4">
          {fields.map((field) => (
            <Field key={field.key} label={field.label} htmlFor={`em-${field.key}`}>
              {field.type === "textarea" ? (
                <Textarea id={`em-${field.key}`} required={field.required} placeholder={field.placeholder}
                  value={String(form[field.key] ?? "")} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
              ) : field.type === "select" ? (
                <Select id={`em-${field.key}`} required={field.required} value={String(form[field.key] ?? "")}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}>
                  <option value="">انتخاب کنید</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              ) : field.type === "checkbox" ? (
                <label className="flex min-h-11 items-center gap-2">
                  <Checkbox id={`em-${field.key}`} checked={Boolean(form[field.key])}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })} />
                  <span className="text-sm text-ink/70">فعال</span>
                </label>
              ) : (
                <Input id={`em-${field.key}`} type={field.type === "number" ? "number" : field.type === "datetime" ? "datetime-local" : "text"}
                  dir={field.type === "number" || field.type === "datetime" ? "ltr" : undefined}
                  required={field.required} placeholder={field.placeholder}
                  value={String(form[field.key] ?? "")}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
              )}
            </Field>
          ))}
          <Button type="submit" disabled={busy || (!editingId && !canCreate)} className="w-full">
            {busy ? "در حال ذخیره..." : editingId ? "ذخیره تغییرات" : createLabel}
          </Button>
          {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
        </form>
      </Card>

      {hideTable ? null : (
      <Card className="overflow-hidden">
        <div className="table-wrap">
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
                  <tr key={id} className={editingId === id ? "bg-primary/5" : undefined}>
                    {columns.map((column) => (
                      <td key={column.key} dir={column.ltr ? "ltr" : undefined}>{display(nested(item, column.key))}</td>
                    ))}
                    <td>
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label="ویرایش" onClick={() => startEdit(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-line/60">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {canDelete ? (
                          <button type="button" aria-label="حذف" disabled={busy} onClick={() => remove(id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!items.length ? (
                <tr><td colSpan={columns.length + 1} className="py-10 text-center text-ink/50">آیتمی یافت نشد.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
      )}
    </div>
  );
}

export function AddHint({ children }: { children: React.ReactNode }) {
  return <p className="mb-6 flex items-center gap-2 text-sm text-ink/55"><Plus className="h-4 w-4" />{children}</p>;
}
