"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Field, Input } from "@/components/ui/field";

interface Profile {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email ?? "",
  });
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, email: form.email || null }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره ناموفق بود");
      setMessage({ text: "اطلاعات ذخیره شد.", tone: "success" });
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-lg font-semibold">اطلاعات شخصی</h2>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="نام" htmlFor="profile-first"><Input id="profile-first" minLength={2} maxLength={60} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
        <Field label="نام خانوادگی" htmlFor="profile-last"><Input id="profile-last" minLength={2} maxLength={60} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <Field label="ایمیل (اختیاری)" htmlFor="profile-email">
            <Input id="profile-email" type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-ink/50">شماره موبایل: <span dir="ltr">{profile.phone}</span> (تغییر شماره نیاز به تأیید مجدد دارد)</p>
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>{busy ? "در حال ذخیره..." : "ذخیره تغییرات"}</Button>
        </div>
        {message ? <div className="sm:col-span-2"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
      </form>
    </Card>
  );
}
