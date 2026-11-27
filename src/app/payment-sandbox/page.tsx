import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard, LockKeyhole, ShieldCheck, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { isProduction } from "@/lib/env";
import { getSiteConfig } from "@/config/site";
import { formatToman, toToman } from "@/lib/money";
import { paymentGatewayLabels } from "@/lib/labels";
import { formatNumber } from "@/lib/persian";

export const metadata: Metadata = { title: "درگاه آزمایشی", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaymentSandboxPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  if (isProduction()) notFound();

  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const payment = await prisma.payment.findFirst({
    where: { orderId, provider: "MOCK" },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          paymentGateway: true,
          recipientName: true,
        },
      },
    },
  });
  if (!payment) notFound();

  if (payment.status === "PAID" || payment.order.paymentStatus === "PAID") {
    redirect(`/checkout/result?${new URLSearchParams({ order: payment.order.orderNumber, status: "success" })}`);
  }

  const site = await getSiteConfig();
  const total = toToman(payment.order.totalAmount);
  const gateway = payment.order.paymentGateway ? paymentGatewayLabels[payment.order.paymentGateway] ?? payment.order.paymentGateway : "درگاه آزمایشی";

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="container-luxury flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl font-bold text-primary">{site.name}</Link>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[10px] font-medium text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> محیط تست — پرداخت واقعی انجام نمی‌شود
          </span>
        </div>
      </header>

      <main className="container-luxury flex flex-1 items-center justify-center py-10 sm:py-16">
        <div className="w-full max-w-4xl overflow-hidden rounded-[32px] border border-line bg-surface shadow-soft">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-7 sm:p-10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">SANDBOX PAYMENT / TEST</p>
                  <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">شبیه‌ساز درگاه پرداخت</h1>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><CreditCard className="h-6 w-6" /></span>
              </div>

              <p className="mt-3 text-sm leading-7 text-ink/55">
                این صفحه رفتار درگاه بانکی را شبیه‌سازی می‌کند تا کل روند ثبت سفارش، پرداخت و بازگشت به سایت تست شود. نتیجه را انتخاب کنید.
              </p>

              <dl className="mt-7 divide-y divide-line rounded-2xl border border-line bg-canvas px-4">
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-ink/50">شماره سفارش</dt>
                  <dd dir="ltr" className="font-semibold text-primary">{payment.order.orderNumber}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-ink/50">درگاه</dt>
                  <dd className="font-medium">{gateway}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-ink/50">گیرنده</dt>
                  <dd className="line-clamp-1 font-medium">{payment.order.recipientName}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <dt className="text-ink/50">مبلغ قابل پرداخت</dt>
                  <dd dir="ltr" className="text-base font-semibold text-primary">{formatToman(total)}</dd>
                </div>
              </dl>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <form action="/api/payments/sandbox/complete" method="post">
                  <input type="hidden" name="authority" value={payment.authority ?? ""} />
                  <input type="hidden" name="outcome" value="success" />
                  <button type="submit" className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                    <CheckCircle2 className="h-5 w-5" /> پرداخت موفق
                  </button>
                </form>
                <form action="/api/payments/sandbox/complete" method="post">
                  <input type="hidden" name="authority" value={payment.authority ?? ""} />
                  <input type="hidden" name="outcome" value="failed" />
                  <button type="submit" className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100">
                    <XCircle className="h-5 w-5" /> پرداخت ناموفق / انصراف
                  </button>
                </form>
              </div>

              <p className="mt-4 flex items-center justify-center gap-2 text-[10px] text-ink/35">
                <LockKeyhole className="h-3.5 w-3.5" /> در حالت توسعه، پرداخت‌های بدون اعتبارنامه به این شبیه‌ساز هدایت می‌شوند.
              </p>
            </div>

            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2D2621] via-[#4A3B31] to-[#211C18] p-8 text-white lg:flex">
              <div aria-hidden className="absolute -left-16 -top-20 h-64 w-64 rounded-full border-[45px] border-white/5" />
              <div aria-hidden className="absolute -bottom-24 -right-14 h-72 w-72 rounded-full border border-white/10" />
              <div className="relative">
                <p className="text-[10px] tracking-[0.3em] text-white/40">TEST TERMINAL</p>
                <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" aria-hidden />
                    <ShieldCheck className="h-5 w-5 text-white/40" />
                  </div>
                  <p className="mt-7 font-mono text-lg tracking-[0.2em] text-white/80" dir="ltr">•••• •••• •••• 4321</p>
                  <div className="mt-5 flex items-end justify-between text-[10px] text-white/45">
                    <span>TEST CARD</span>
                    <span dir="ltr">12/99</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <p className="font-display text-xl italic text-white/70">{site.name} payment sandbox</p>
                <p className="mt-2 text-[11px] leading-6 text-white/40">
                  این شبیه‌ساز بعد از نتیجه، شما را به صفحهٔ نتیجهٔ سفارش در همین دامنه برمی‌گرداند.
                </p>
                <p className="mt-3 text-[10px] text-white/30">شناسه پرداخت: <span dir="ltr">{payment.authority?.slice(0, 18)}…</span></p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-line bg-surface py-5">
        <div className="container-luxury flex flex-wrap items-center justify-between gap-3 text-[10px] text-ink/40">
          <span>© {formatNumber(new Date().getFullYear())} {site.name} — sandbox only</span>
          <Link href="/" className="inline-flex items-center gap-1 hover:text-primary">بازگشت به فروشگاه <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </footer>
    </div>
  );
}
