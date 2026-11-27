"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Bike,
  Check,
  Mail,
  Package,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, Card, EmptyState } from "@/components/ui/display";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { PaymentGatewayLogo } from "@/components/payment-gateway-logo";
import { TrackEvent } from "@/components/track-event";
import { track } from "@/lib/analytics-client";
import type { Address } from "@prisma/client";
import type { CartView as CartViewType } from "@/services/cart";
import type { PaymentGatewayName } from "@/services/payment";
import { formatToman, type ShippingMethodKey } from "@/lib/money";
import {
  formatNumber,
  isValidIranianPhone,
  isValidPostalCode,
  normalizeForSearch,
  normalizeIranianPhone,
} from "@/lib/persian";

interface Props {
  cart: CartViewType;
  addresses: Address[];
  phone: string;
  shipping: {
    flat: number;
    alopeyk: number;
    pishtaz: number;
    tipax: number;
    freeThreshold: number;
  };
  couponEnabled: boolean;
}

const gatewayTitles: Record<PaymentGatewayName, string> = {
  ZARINPAL: "زرین‌پال",
  ZIBAL: "زیبال",
  BEHPARDAKHT: "به‌پرداخت ملت",
};

const gatewayDescriptions: Record<PaymentGatewayName, string> = {
  ZARINPAL: "پرداخت امن با کارت‌های بانکی",
  ZIBAL: "درگاه پرداخت آنلاین زیبال",
  BEHPARDAKHT: "درگاه بانک ملت",
};

const gatewayOrder: PaymentGatewayName[] = ["ZARINPAL", "ZIBAL", "BEHPARDAKHT"];

export function CheckoutForm({ cart, addresses, phone, shipping, couponEnabled }: Props) {
  const [addressMode, setAddressMode] = useState<"saved" | "new">(addresses.length ? "saved" : "new");
  const [addressId, setAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [form, setForm] = useState({
    label: "خانه", fullName: "", phone, province: "", city: "", street: "", postalCode: "", isDefault: false,
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodKey>("PISHTAZ");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");
  const [paymentGateway, setPaymentGateway] = useState<PaymentGatewayName>("ZARINPAL");
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "info" | "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);
  // One key per mounted form so retries after a timeout cannot double-charge.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const selectedAddress = addresses.find((address) => address.id === addressId);
  const deliveryCity = addressMode === "saved" ? selectedAddress?.city ?? "" : form.city;
  const alopeykAvailable = normalizeForSearch(deliveryCity).includes(normalizeForSearch("تهران"));

  const shippingOptions = [
    {
      key: "FLAT" as const,
      title: "نرخ ثابت",
      description: "ارسال با نرخ ثابت به سراسر کشور",
      price: shipping.flat,
      eta: "۲ تا ۴ روز کاری",
      icon: Banknote,
    },
    {
      key: "ALOPEYK" as const,
      title: "الو پیک",
      description: "ارسال سریع درون‌شهری",
      price: shipping.alopeyk,
      eta: "تحویل سریع",
      icon: Bike,
      tehranOnly: true,
    },
    {
      key: "PISHTAZ" as const,
      title: "پست پیشتاز",
      description: "ارسال سراسری با کد رهگیری",
      price: shipping.pishtaz,
      eta: "۲ تا ۴ روز کاری",
      icon: Mail,
    },
    {
      key: "TIPAX" as const,
      title: "تیپاکس",
      description: "ارسال ایمن و قابل پیگیری",
      price: shipping.tipax,
      eta: "۲ تا ۴ روز کاری",
      icon: Package,
    },
  ];

  const shippingCost = useMemo(() => {
    if (cart.subtotal >= shipping.freeThreshold) return 0;
    switch (shippingMethod) {
      case "FLAT": return shipping.flat;
      case "ALOPEYK": return shipping.alopeyk;
      case "PISHTAZ": return shipping.pishtaz;
      case "TIPAX": return shipping.tipax;
      default: return shipping.pishtaz;
    }
  }, [cart.subtotal, shipping, shippingMethod]);

  // Switching to a non-Tehran address must not leave AloPeyk selected.
  useEffect(() => {
    if (shippingMethod === "ALOPEYK" && !alopeykAvailable) setShippingMethod("PISHTAZ");
  }, [alopeykAvailable, shippingMethod]);

  const unavailable = cart.items.filter((item) => !item.available);

  if (!cart.items.length) {
    return (
      <EmptyState
        title="سبد خرید خالی است"
        description="برای ثبت سفارش ابتدا محصولی به سبد خرید اضافه کنید."
        action={<ButtonLink href="/shop" className="mt-2">رفتن به فروشگاه</ButtonLink>}
      />
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (shippingMethod === "ALOPEYK" && !alopeykAvailable) {
      setMessage({ text: "الو پیک فقط برای آدرس‌های شهر تهران فعال است.", tone: "error" });
      return;
    }

    if (addressMode === "new") {
      if (!isValidIranianPhone(form.phone) || !isValidPostalCode(form.postalCode)) {
        setMessage({ text: "شماره موبایل یا کد پستی نامعتبر است", tone: "error" });
        return;
      }
    }

    setBusy(true);
    try {
      track("add_shipping_info", { metadata: { shippingMethod, paymentMethod, itemCount: cart.itemCount, subtotal: cart.subtotal } });
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          ...(addressMode === "saved" ? { addressId } : {
            address: { ...form, phone: normalizeIranianPhone(form.phone) },
          }),
          shippingMethod,
          paymentMethod,
          ...(paymentMethod === "ONLINE" ? { paymentGateway } : {}),
          ...(couponCode ? { couponCode } : {}),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "ثبت سفارش ناموفق بود");
      if (body.data.redirectUrl) {
        track("payment_initiated", { metadata: { orderNumber: body.data.orderNumber, paymentMethod, paymentGateway, total: body.data.total ?? null } });
        window.location.assign(body.data.redirectUrl);
        return;
      }
      if (body.data.orderStatus === "PROCESSING" || body.data.orderStatus === "PAID" || body.data.paymentStatus === "PAID") {
        setMessage({ text: `سفارش ${body.data.orderNumber} ثبت شد.`, tone: "success" });
        window.location.assign(`/checkout/result?order=${encodeURIComponent(body.data.orderNumber)}&status=success`);
        return;
      }
      if (body.data.paymentStatus === "PENDING") {
        setMessage({
          text: `سفارش ${body.data.orderNumber} قبلاً ثبت شده و در انتظار پرداخت است. آن را از حساب خود پیگیری کنید.`,
          tone: "info",
        });
        return;
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const selectedShipping = shippingOptions.find((option) => option.key === shippingMethod);

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <TrackEvent name="begin_checkout" properties={{ metadata: { itemCount: cart.itemCount, subtotal: cart.subtotal } }} />
      {unavailable.length ? (
        <div className="lg:col-span-2">
          <Alert tone="error">
            {unavailable.map((item) => item.productName).join("، ")} در حال حاضر با این تعداد موجود نیست. برای ادامه، تعداد یا محصولات سبد را اصلاح کنید.
            {" "}<a href="/cart" className="underline">بازگشت به سبد خرید</a>
          </Alert>
        </div>
      ) : null}

      <div className="space-y-6">
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">آدرس تحویل</h2>
            <span className="text-[10px] tracking-[0.2em] text-ink/35">۰۱ / ADDRESS</span>
          </div>
          {addresses.length ? (
            <div className="mb-5 flex gap-2">
              <Button type="button" variant={addressMode === "saved" ? "primary" : "outline"} onClick={() => setAddressMode("saved")}>
                آدرس‌های ذخیره‌شده
              </Button>
              <Button type="button" variant={addressMode === "new" ? "primary" : "outline"} onClick={() => setAddressMode("new")}>
                آدرس جدید
              </Button>
            </div>
          ) : null}

          {addressMode === "saved" && addresses.length ? (
            <div className="space-y-3">
              {addresses.map((address) => (
                <label key={address.id} className="flex cursor-pointer gap-3 rounded-2xl border border-line p-4 has-[:checked]:border-primary">
                  <input type="radio" name="address" className="mt-1 h-5 w-5 accent-[var(--color-primary)]" checked={addressId === address.id} onChange={() => setAddressId(address.id)} />
                  <span className="text-sm">
                    <span className="font-semibold">{address.label} — {address.fullName}</span>
                    <span className="mt-1 block text-ink/60">{address.province}، {address.city}، {address.street}</span>
                    <span dir="ltr" className="mt-1 block text-xs text-ink/50">{address.postalCode}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان آدرس" htmlFor="co-label"><Input id="co-label" required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
              <Field label="نام و نام خانوادگی" htmlFor="co-name"><Input id="co-name" required minLength={3} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
              <Field label="شماره موبایل" htmlFor="co-phone" hint="مثال: 09123456789">
                <Input id="co-phone" dir="ltr" inputMode="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="کد پستی" htmlFor="co-postal" hint="۱۰ رقم">
                <Input id="co-postal" dir="ltr" inputMode="numeric" required maxLength={14} value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
              </Field>
              <Field label="استان" htmlFor="co-province"><Input id="co-province" required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></Field>
              <Field label="شهر" htmlFor="co-city"><Input id="co-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
              <div className="sm:col-span-2">
                <Field label="آدرس دقیق" htmlFor="co-street">
                  <Textarea id="co-street" required minLength={5} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
                </Field>
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2">
                <Checkbox checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                این آدرس پیش‌فرض باشد
              </label>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">روش ارسال</h2>
              <p className="mt-1 text-xs text-ink/45">زمان تقریبی بر اساس روزهای کاری است.</p>
            </div>
            <span className="text-[10px] tracking-[0.2em] text-ink/35">۰۲ / SHIPPING</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {shippingOptions.map((option) => {
              const Icon = option.icon;
              const disabled = Boolean(option.tehranOnly && !alopeykAvailable);
              const selected = shippingMethod === option.key;
              return (
                <label
                  key={option.key}
                  className={`relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-all focus-within:ring-2 focus-within:ring-primary/30 ${
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-line bg-surface hover:border-primary/40"
                  } ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={option.key}
                    className="sr-only"
                    disabled={disabled}
                    checked={selected}
                    onChange={() => setShippingMethod(option.key)}
                  />
                  <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-primary text-white" : "bg-canvas text-primary/70"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold">{option.title}</span>
                      <span dir="ltr" className="text-xs font-semibold text-primary">
                        {cart.subtotal >= shipping.freeThreshold || option.price === 0 ? "رایگان" : formatToman(option.price)}
                      </span>
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-ink/45">{option.description}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-ink/35">
                      <span className="rounded-full bg-canvas px-2 py-0.5">{option.eta}</span>
                      {option.tehranOnly ? <span className={`rounded-full px-2 py-0.5 ${alopeykAvailable ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>فقط تهران</span> : null}
                    </span>
                  </span>
                  <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-line bg-surface text-transparent"}`}>
                    <Check className="h-3 w-3" />
                  </span>
                </label>
              );
            })}
          </div>
          {!alopeykAvailable ? (
            <p className="mt-3 rounded-xl bg-canvas px-3 py-2 text-[11px] leading-5 text-ink/45">
              الو پیک فقط برای شهر تهران فعال است. با انتخاب آدرس تهران، این گزینه فعال می‌شود.
            </p>
          ) : null}

          <div className="my-6 h-px bg-line" />

          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">روش پرداخت</h2>
              <p className="mt-1 text-xs text-ink/45">درگاه بانکی موردنظر را انتخاب کنید.</p>
            </div>
            <span className="text-[10px] tracking-[0.2em] text-ink/35">۰۳ / PAYMENT</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="درگاه پرداخت">
            {gatewayOrder.map((gateway) => {
              const selected = paymentMethod === "ONLINE" && paymentGateway === gateway;
              return (
                <label
                  key={gateway}
                  className={`relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-all focus-within:ring-2 focus-within:ring-primary/30 ${
                    selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-line bg-surface hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={gateway}
                    className="sr-only"
                    checked={selected}
                    onChange={() => {
                      setPaymentMethod("ONLINE");
                      setPaymentGateway(gateway);
                    }}
                  />
                  <span className="flex items-start justify-between gap-2">
                    <PaymentGatewayLogo gateway={gateway} className="h-11 w-11 rounded-xl shadow-sm" />
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-line bg-surface text-transparent"}`}>
                      <Check className="h-3 w-3" />
                    </span>
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{gatewayTitles[gateway]}</span>
                    <span className="mt-1 block text-[10px] leading-5 text-ink/45">{gatewayDescriptions[gateway]}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <label className={`mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all focus-within:ring-2 focus-within:ring-primary/30 ${paymentMethod === "COD" ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-line bg-surface hover:border-primary/40"}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              className="sr-only"
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
            />
            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${paymentMethod === "COD" ? "bg-primary text-white" : "bg-canvas text-primary/70"}`}>
              <Wallet className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">پرداخت در محل</span>
              <span className="mt-0.5 block text-[10px] text-ink/45">پرداخت نقدی یا با کارت هنگام تحویل سفارش</span>
            </span>
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${paymentMethod === "COD" ? "border-primary bg-primary text-white" : "border-line bg-surface text-transparent"}`}>
              <Check className="h-3 w-3" />
            </span>
          </label>

          <p className="mt-4 flex items-center gap-2 text-[10px] leading-5 text-ink/40">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            اطلاعات کارت بانکی شما در فروشگاه ذخیره نمی‌شود و پرداخت در محیط امن درگاه انجام می‌گیرد.
          </p>

          {couponEnabled ? (
            <div className="mt-6">
              <Field label="کد تخفیف (اختیاری)" htmlFor="co-coupon" hint="کد در سرور بررسی و محاسبه می‌شود">
                <Input id="co-coupon" dir="ltr" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="ILKAII10" />
              </Field>
            </div>
          ) : null}
        </Card>
      </div>

      <Card className="h-fit p-6 lg:sticky lg:top-28">
        <h2 className="mb-5 text-lg font-semibold">خلاصه سفارش</h2>
        <div className="mb-4 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-xs">
              <span className="min-w-0 flex-1 truncate text-ink/65">{item.productName} × {formatNumber(item.quantity)}</span>
              <span dir="ltr">{formatToman(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <dl className="space-y-3 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink/60">جمع کالاها</dt><dd dir="ltr">{formatToman(cart.subtotal)}</dd></div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink/60">ارسال — {selectedShipping?.title ?? "پست پیشتاز"}</dt>
            <dd dir="ltr">{shippingCost === 0 ? "رایگان" : formatToman(shippingCost)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-base font-semibold">
            <dt>برآورد مبلغ</dt><dd dir="ltr" className="text-primary">{formatToman(cart.subtotal + shippingCost)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink/50">تخفیف احتمالی در تأیید نهایی سرور اعمال می‌شود.</p>
        {message ? <div className="mt-4"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy || unavailable.length > 0}>
          {busy
            ? "در حال ثبت سفارش..."
            : paymentMethod === "COD"
              ? "ثبت سفارش (پرداخت در محل)"
              : `پرداخت با ${gatewayTitles[paymentGateway]}`}
        </Button>
      </Card>
    </form>
  );
}
