"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/display";
import { Checkbox, Field, Textarea } from "@/components/ui/field";

export function CustomerNotes({ customerId, initialNote, initialOptIn }: { customerId: string; initialNote: string; initialOptIn: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [optIn, setOptIn] = useState(initialOptIn);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/notes`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ adminNote: note, marketingOptIn: optIn }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره ناموفق بود");
      setMessage({ tone: "success", text: "یادداشت و رضایت بازاریابی ذخیره شد." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <Field label="یادداشت داخلی (فقط برای مدیران)" htmlFor="customer-note">
        <Textarea id="customer-note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} placeholder="ترجیحات مشتری، پیگیری‌ها…" />
      </Field>
      <label className="flex min-h-10 items-center gap-2 text-xs text-ink/65">
        <Checkbox checked={optIn} onChange={(event) => setOptIn(event.target.checked)} />
        رضایت دریافت پیام‌های بازاریابی ثبت شده است
      </label>
      <Button type="button" size="sm" onClick={save} disabled={busy}>{busy ? "در حال ذخیره…" : "ذخیره"}</Button>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
    </div>
  );
}
