"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Address } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { formatJalali, isValidIranianPhone, isValidPostalCode, normalizeIranianPhone } from "@/lib/persian";

const empty = {
  label: "خانه", fullName: "", phone: "", province: "", city: "", street: "", postalCode: "", isDefault: false,
};

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...empty });
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidIranianPhone(form.phone) || !isValidPostalCode(form.postalCode)) {
      setMessage({ text: "شماره موبایل یا کد پستی نامعتبر است", tone: "error" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, phone: normalizeIranianPhone(form.phone) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره آدرس ناموفق بود");
      setForm({ ...empty });
      setMessage({ text: "آدرس ذخیره شد.", tone: "success" });
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        {addresses.length ? addresses.map((address) => (
          <Card key={address.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{address.label} {address.isDefault ? <span className="mr-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">پیشفرض</span> : null}</p>
                <p className="mt-1 text-sm text-ink/70">{address.fullName}</p>
                <p className="mt-1 text-xs leading-6 text-ink/55">{address.province}، {address.city}، {address.street}</p>
                <p dir="ltr" className="mt-1 text-xs text-ink/50">{address.postalCode} — {address.phone}</p>
                <p className="mt-2 text-[10px] text-ink/40">{formatJalali(address.createdAt)}</p>
              </div>
              <button type="button" aria-label="حذف آدرس" onClick={() => remove(address.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-red-600 hover:border-red-300"><Trash2 className="h-4 w-4" /></button>
            </div>
          </Card>
        )) : <Card className="p-6 text-sm text-ink/55">آدرسی ذخیره نشده است.</Card>}
      </div>

      <Card className="h-fit p-6">
        <h2 className="mb-5 text-lg font-semibold">افزودن آدرس</h2>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="عنوان" htmlFor="addr-label"><Input id="addr-label" required minLength={2} maxLength={60} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
          <Field label="نام و نام خانوادگی" htmlFor="addr-name"><Input id="addr-name" required minLength={3} maxLength={100} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="موبایل" htmlFor="addr-phone"><Input id="addr-phone" dir="ltr" inputMode="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09123456789" /></Field>
          <Field label="کد پستی" htmlFor="addr-postal"><Input id="addr-postal" dir="ltr" inputMode="numeric" required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="1234567890" /></Field>
          <Field label="استان" htmlFor="addr-province"><Input id="addr-province" required minLength={2} value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></Field>
          <Field label="شهر" htmlFor="addr-city"><Input id="addr-city" required minLength={2} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="آدرس دقیق" htmlFor="addr-street"><Textarea id="addr-street" required minLength={5} maxLength={300} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></Field>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
            <Checkbox checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            تنظیم به عنوان آدرس پیشفرض
          </label>
          <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "در حال ذخیره..." : "ذخیره آدرس"}</Button></div>
          {message ? <div className="sm:col-span-2"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
        </form>
      </Card>
    </div>
  );
}
