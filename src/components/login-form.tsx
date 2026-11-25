"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Field, Input } from "@/components/ui/field";
import { formatNumber, isValidIranianPhone, normalizeIranianPhone } from "@/lib/persian";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "info" | "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const request = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = normalizeIranianPhone(phone);
    if (!normalized || !isValidIranianPhone(phone)) {
      setMessage({ text: "شماره موبایل ایرانی نامعتبر است", tone: "error" });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "ارسال کد ناموفق بود");
      setPhone(normalized);
      setStep("code");
      setRetryAfter(body.data.retryAfterSeconds ?? 60);
      setMessage({ text: "کد تأیید ارسال شد.", tone: "success" });
      if (process.env.NODE_ENV !== "production") {
        const dev = await fetch(`/api/auth/dev-otp?phone=${encodeURIComponent(normalized)}`, { cache: "no-store" });
        const devBody = await dev.json();
        setDevOtp(devBody?.data?.otp ?? null);
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalizeIranianPhone(phone), otp }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "تأیید ناموفق بود");
      router.push("/account");
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold">{step === "phone" ? "ورود به حساب" : "تأیید شماره"}</h1>
      <p className="mt-2 text-sm leading-6 text-ink/60">
        {step === "phone"
          ? "شماره موبایل خود را وارد کنید تا کد تأیید ارسال شود. حساب جدیدی به صورت خودکار ایجاد میشود."
          : `کد ۶ رقمی ارسالشده به ${phone} را وارد کنید.`}
      </p>

      {step === "phone" ? (
        <form onSubmit={request} className="mt-8 space-y-5">
          <Field label="شماره موبایل" htmlFor="login-phone" hint="مثال: ۰۹۱۲۳۴۵۶۷۸۹">
            <Input id="login-phone" dir="ltr" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "در حال ارسال..." : "ارسال کد تأیید"}</Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-5">
          <Field label="کد تأیید" htmlFor="login-otp">
            <Input id="login-otp" dir="ltr" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="text-center text-xl tracking-widest" />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={busy || otp.length !== 6}>{busy ? "در حال تأیید..." : "ورود"}</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("phone")}>تغییر شماره</Button>
          <p className="text-center text-xs text-ink/50">ارسال مجدد کد پس از {formatNumber(retryAfter)} ثانیه</p>
        </form>
      )}

      {devOtp ? (
        <div className="mt-5 rounded-xl border border-dashed border-primary/50 bg-primary/5 p-3 text-center text-xs">
          کد آزمایشی (فقط توسعه): <span dir="ltr" className="font-bold tracking-widest text-primary">{devOtp}</span>
        </div>
      ) : null}
      {message ? <div className="mt-5"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
      <p className="mt-6 text-center text-xs text-ink/50">
        با ورود، <Link href="/terms" className="underline">شرایط استفاده</Link> و <Link href="/privacy" className="underline">حریم خصوصی</Link> را میپذیرید.
      </p>
    </Card>
  );
}
