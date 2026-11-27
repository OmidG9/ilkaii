import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, PackageCheck, ShoppingBag, Truck, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { Alert, Breadcrumbs } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { normalizeSearchParams } from "@/lib/search-params";
import type { RawSearchParams } from "@/lib/search-params";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/labels";
import { formatToman, toToman } from "@/lib/money";

export const metadata: Metadata = { title: "نتیجه سفارش", robots: { index: false } };
export const dynamic = "force-dynamic";

type Outcome = "success" | "failed" | "pending" | "review" | "unknown";

export default async function CheckoutResultPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = normalizeSearchParams(await searchParams);
  const requested = params.status;
  const orderNumber = params.order ?? "";
  const user = await getSessionUser().catch(() => null);

  // Query strings are only hints. The signed-in customer's actual order state
  // decides what we show, and no other customer's order can be disclosed.
  const order = user && orderNumber
    ? await prisma.order.findFirst({
        where: { orderNumber, userId: user.id },
        select: {
          orderNumber: true, status: true, paymentStatus: true, paymentMethod: true,
          totalAmount: true, createdAt: true,
          payments: { select: { status: true, authority: true } },
        },
      })
    : null;
  const hasCapturedPayment = Boolean(order?.payments.some((payment) => payment.status === "PAID"));

  let outcome: Outcome;
  if (order) {
    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      outcome = order.paymentStatus === "REFUNDED" || hasCapturedPayment ? "review" : "failed";
    } else if (order.status === "PENDING_PAYMENT") {
      outcome = "pending";
    } else {
      outcome = "success";
    }
  } else if (requested === "success" && !user) {
    outcome = "success";
  } else if (requested === "pending") {
    outcome = "pending";
  } else if (requested === "review") {
    outcome = "review";
  } else if (requested === "success") {
    outcome = "unknown";
  } else {
    outcome = "failed";
  }

  const isCodSuccess = outcome === "success" && order?.paymentMethod === "COD";
  const canResume = Boolean(
    order && order.status === "PENDING_PAYMENT" && order.paymentStatus === "PENDING" &&
    order.payments.some((payment) => payment.status === "PENDING" && payment.authority),
  );
  const loginNext = `/checkout/result?${new URLSearchParams({ order: orderNumber, status: requested || "pending" })}`;
  const payLabel = order?.paymentMethod === "COD" && order.paymentStatus === "PENDING"
    ? "پرداخت هنگام تحویل"
    : order
      ? paymentStatusLabels[order.paymentStatus]
      : null;

  const view = {
    success: {
      icon: <CheckCircle2 className="h-9 w-9" />,
      tone: "bg-emerald-100 text-emerald-700",
      eyebrow: "ORDER CONFIRMED",
      title: "سفارش شما ثبت شد.",
      body: isCodSuccess
        ? "سفارش شما ثبت شد و مبلغ آن هنگام تحویل دریافت می‌شود. جزئیات و وضعیت را می‌توانید از حساب کاربری یا صفحهٔ پیگیری ببینید."
        : "پرداخت شما تأیید شد و سفارش وارد صف آماده‌سازی است. جزئیات و وضعیت را می‌توانید از حساب کاربری یا صفحهٔ پیگیری ببینید.",
    },
    pending: {
      icon: <Clock3 className="h-9 w-9" />,
      tone: "bg-amber-100 text-amber-700",
      eyebrow: "PAYMENT PENDING",
      title: "پرداخت در حال بررسی است.",
      body: "سفارش شما ثبت شده است. نتیجهٔ نهایی پرداخت پس از تأیید درگاه در همین صفحه و صفحهٔ سفارش نمایش داده می‌شود.",
    },
    review: {
      icon: <AlertTriangle className="h-9 w-9" />,
      tone: "bg-amber-100 text-amber-700",
      eyebrow: "PAYMENT REVIEW",
      title: "پرداخت نیاز به بررسی دارد.",
      body: "اگر مبلغی از حساب شما کسر شده است، لطفاً شمارهٔ سفارش را به پشتیبانی اعلام کنید تا وضعیت پرداخت بررسی و در صورت نیاز بازپرداخت شود.",
    },
    failed: {
      icon: <XCircle className="h-9 w-9" />,
      tone: "bg-red-100 text-red-700",
      eyebrow: "PAYMENT NOT COMPLETED",
      title: "پرداخت کامل نشد.",
      body: "پرداخت تکمیل نشد و موجودی محصولات دوباره آزاد شد. سبد خرید را بررسی کنید؛ اگر محصولات در سبد نیستند، می‌توانید دوباره آن‌ها را انتخاب کنید.",
    },
    unknown: {
      icon: <XCircle className="h-9 w-9" />,
      tone: "bg-line text-ink/60",
      eyebrow: "ORDER NOT FOUND",
      title: "این سفارش در حساب شما پیدا نشد.",
      body: "اگر پرداخت انجام شده است، لطفاً شمارهٔ سفارش را به پشتیبانی اعلام کنید. همچنین می‌توانید از صفحهٔ سفارش‌ها وضعیت را بررسی کنید.",
    },
  }[outcome];

  return (
    <div className="container-luxury py-10 sm:py-16">
      <Breadcrumbs items={[{ label: "نتیجه سفارش" }]} />
      <div className="mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-[36px] border border-line bg-surface">
          <div aria-hidden className="grain absolute inset-0 opacity-50" />
          <div className="relative p-8 text-center sm:p-12">
            <span className={`mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full ${view.tone}`}>
              {view.icon}
            </span>
            <p className="eyebrow mt-6">{view.eyebrow}</p>
            <h1 className="mt-4 text-balance text-3xl font-semibold sm:text-4xl">{view.title}</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-ink/55">{view.body}</p>

            {orderNumber ? (
              <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-canvas px-4 py-2.5 text-xs">
                <span className="text-ink/40">شمارهٔ سفارش</span>
                <span dir="ltr" className="font-semibold text-primary">{orderNumber}</span>
              </div>
            ) : null}

            {order ? (
              <div className="mx-auto mt-3 flex max-w-xl flex-wrap items-center justify-center gap-2 text-[11px]">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{orderStatusLabels[order.status]}</span>
                <span className="rounded-full bg-line px-3 py-1 text-ink/60">{payLabel}</span>
                <span dir="ltr" className="rounded-full bg-line px-3 py-1 text-ink/60">{formatToman(toToman(order.totalAmount))}</span>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {outcome === "success" ? (
                <>
                  {order ? (
                    <ButtonLink href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} size="lg">مشاهدهٔ سفارش</ButtonLink>
                  ) : (
                    <ButtonLink href={`/auth/login?next=${encodeURIComponent(loginNext)}`} size="lg">ورود برای مشاهدهٔ سفارش</ButtonLink>
                  )}
                  <ButtonLink href="/shop" variant="outline" size="lg"><ShoppingBag className="h-4 w-4" /> ادامهٔ خرید</ButtonLink>
                </>
              ) : null}

              {outcome === "failed" ? (
                <>
                  <ButtonLink href="/cart" size="lg">بازگشت به سبد خرید</ButtonLink>
                  <ButtonLink href="/checkout" variant="outline" size="lg">تلاش مجدد</ButtonLink>
                  <ButtonLink href="/contact" variant="outline" size="lg">تماس با پشتیبانی</ButtonLink>
                </>
              ) : null}

              {outcome === "pending" || outcome === "review" || outcome === "unknown" ? (
                <>
                  {canResume && order ? (
                    <ButtonLink href={`/api/payments/resume?order=${encodeURIComponent(order.orderNumber)}`} size="lg">ادامهٔ پرداخت</ButtonLink>
                  ) : null}
                  {order ? (
                    <ButtonLink href={`/account/orders/${encodeURIComponent(order.orderNumber)}`} variant={canResume ? "outline" : "primary"} size="lg">
                      مشاهدهٔ سفارش
                    </ButtonLink>
                  ) : user ? null : (
                    <ButtonLink href={`/auth/login?next=${encodeURIComponent(loginNext)}`} size="lg">ورود به حساب</ButtonLink>
                  )}
                  <ButtonLink href="/contact" variant="outline" size="lg">تماس با پشتیبانی</ButtonLink>
                </>
              ) : null}
            </div>

            {outcome === "failed" ? (
              <div className="mt-7 text-right"><Alert tone="error">در صورت کسر مبلغ از حساب بانکی، مبلغ طبق رویهٔ درگاه بازگردانده می‌شود. برای پیگیری، شمارهٔ سفارش را به پشتیبانی اعلام کنید.</Alert></div>
            ) : null}
            {outcome === "review" || outcome === "unknown" ? (
              <div className="mt-7 text-right"><Alert tone="error">در صورت کسر مبلغ از حساب، با پشتیبانی تماس بگیرید و شمارهٔ سفارش را اعلام کنید.</Alert></div>
            ) : null}
          </div>
        </div>

        {outcome === "success" ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Clock3, title: "آماده‌سازی", text: "۱ تا ۳ روز کاری" },
              { icon: PackageCheck, title: "بسته‌بندی", text: "بررسی و ایمن‌سازی" },
              { icon: Truck, title: "ارسال", text: "با کد رهگیری" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-line bg-surface p-5 text-center">
                <Icon className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-3 text-xs font-semibold">{title}</p>
                <p className="mt-1 text-[10px] text-ink/40">{text}</p>
              </div>
            ))}
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs text-ink/40">
          <Link href="/track" className="underline underline-offset-4 hover:text-primary">پیگیری سفارش</Link>
          <span className="mx-2 text-ink/20">|</span>
          <Link href="/faq" className="underline underline-offset-4 hover:text-primary">سؤالات متداول</Link>
        </p>
      </div>
    </div>
  );
}
