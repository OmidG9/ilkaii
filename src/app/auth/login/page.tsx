"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FA } from "@/lib/translations";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "خطایی رخ داده است.");
      }

      setMessage("کد تایید برای شما ارسال شد. لطفاً آن را وارد کنید.");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطایی رخ داده است.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        phone,
        otp,
        callbackUrl: redirectUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        router.push(redirectUrl);
      } else {
        throw new Error("ورود امکان‌پذیر نیست. دوباره تلاش کنید.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطایی رخ داده است.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-luxury-background py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-xl rounded-[32px] border border-luxury-border bg-white p-8 shadow-sm">
          <div className="mb-8 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-luxury-text/50">
              {FA.auth.login} / {FA.auth.signup}
            </p>
            <h1 className="text-3xl font-serif font-bold text-luxury-primary">
              سریع و امن با شماره موبایل وارد شوید
            </h1>
            <p className="text-sm text-luxury-text/70">
              با ارسال کد تایید به موبایل، ورود یا ثبت‌نام شما فعال می‌شود.
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          {step === "phone" ? (
            <form onSubmit={requestOtp} className="space-y-5">
              <label className="block text-sm font-medium text-luxury-text/80">
                شماره موبایل
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="09xxxxxxxxx"
                  required
                  className="mt-2 w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none focus:border-luxury-primary"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-luxury-primary px-6 py-4 text-base font-semibold text-white transition hover:bg-luxury-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "در حال ارسال..." : FA.auth.sendOTP}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5">
              <label className="block text-sm font-medium text-luxury-text/80">
                شماره موبایل
                <input
                  type="tel"
                  value={phone}
                  disabled
                  className="mt-2 w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-luxury-text/80">
                {FA.auth.otp}
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  maxLength={6}
                  placeholder="123456"
                  required
                  className="mt-2 w-full rounded-3xl border border-luxury-border bg-luxury-background px-4 py-3 text-base text-luxury-text outline-none focus:border-luxury-primary"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="inline-flex w-full items-center justify-center rounded-3xl border border-luxury-border bg-luxury-background px-6 py-4 text-base font-semibold text-luxury-text transition hover:border-luxury-primary"
                >
                  تغییر شماره
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-luxury-primary px-6 py-4 text-base font-semibold text-white transition hover:bg-luxury-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "در حال تایید..." : FA.auth.verifyOTP}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 rounded-3xl bg-luxury-background px-5 py-4 text-sm text-luxury-text/70">
            <p className="font-medium text-luxury-text">نکته</p>
            <p className="mt-2">
              اگر شماره شما جدید باشد، با ارسال کد تایید حساب جدید شما ساخته
              می‌شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
