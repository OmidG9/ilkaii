"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/display";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";

export interface SimpleSettingField {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox" | "select";
  hint?: string;
  options?: Array<{ value: string; label: string }>;
}

export function SimpleSettingsForm({ title, description, fields, values }: { title: string; description?: string; fields: SimpleSettingField[]; values: Record<string, string> }) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, string>>(values);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: state }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره تنظیمات ناموفق بود");
      setMessage({ tone: "success", text: "تنظیمات ذخیره شد." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="admin-panel max-w-3xl space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-5 text-ink/50">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.type === "checkbox" ? "sm:col-span-2" : undefined}>
            <Field label={field.label} hint={field.hint} htmlFor={`kv-${field.key}`}>
              {field.type === "checkbox" ? (
                <label className="flex min-h-11 items-center gap-2 text-sm text-ink/70">
                  <Checkbox id={`kv-${field.key}`} checked={state[field.key] === "true"} onChange={(event) => setState({ ...state, [field.key]: event.target.checked ? "true" : "false" })} />
                  فعال
                </label>
              ) : field.type === "select" ? (
                <Select id={`kv-${field.key}`} value={state[field.key] ?? ""} onChange={(event) => setState({ ...state, [field.key]: event.target.value })}>
                  {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              ) : (
                <Input id={`kv-${field.key}`} type={field.type === "number" ? "number" : "text"} dir={field.type === "number" ? "ltr" : undefined}
                  value={state[field.key] ?? ""} onChange={(event) => setState({ ...state, [field.key]: event.target.value })} />
              )}
            </Field>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" size="sm" disabled={busy}>{busy ? "در حال ذخیره…" : "ذخیره تنظیمات"}</Button>
        {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      </div>
    </form>
  );
}
