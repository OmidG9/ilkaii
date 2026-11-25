"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, Card, EmptyState } from "@/components/ui/display";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { TrackEvent } from "@/components/track-event";
import { track } from "@/lib/analytics-client";
import type { Address } from "@prisma/client";
import type { CartView as CartViewType } from "@/services/cart";
import { formatToman } from "@/lib/money";
import { formatNumber, isValidIranianPhone, isValidPostalCode, normalizeIranianPhone } from "@/lib/persian";

interface Props {
  cart: CartViewType;
  addresses: Address[];
  phone: string;
  shipping: { postal: number; courier: number; pickup: number; freeThreshold: number };
}

const shippingLabels = {
  POSTAL: "پست",
  COURIER: "پیک",
  PICKUP: "تحویل حضوری",
} as const;

export function CheckoutForm({ cart, addresses, phone, shipping }: Props) {
  const router = useRouter();
  const [addressMode, setAddressMode] = useState<"saved" | "new">(addresses.length ? "saved" : "new");
  const [addressId, setAddressId] = useState(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");
  const [form, setForm] = useState({
    label: "خانه", fullName: "", phone, province: "", city: "", street: "", postalCode: "", isDefault: false,
  });
  const [shippingMethod, setShippingMethod] = useState<keyof typeof shippingLabels>("POSTAL");
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "COD">("ONLINE");
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "info" | "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);
  // One key per mounted form so retries after a timeout cannot double-charge.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const shippingCost = useMemo(() => {
    if (cart.subtotal >= shipping.freeThreshold) return 0;
    return shippingMethod === "POSTAL" ? shipping.postal : shippingMethod === "COURIER" ? shipping.courier : shipping.pickup;
  }, [cart.subtotal, shipping, shippingMethod]);

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
          ...(couponCode ? { couponCode } : {}),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error?.message ?? "ثبت سفارش ناموفق بود");
      if (body.data.redirectUrl) {
        track("payment_initiated", { metadata: { orderNumber: body.data.orderNumber, paymentMethod, total: body.data.total ?? null } });
        window.location.assign(body.data.redirectUrl);
        return;
      }
      if (body.data.paymentStatus === "PENDING") {
        setMessage({
          text: `سفارش ${body.data.orderNumber} قبلاً ثبت شده و در انتظار پرداخت است. آن را از حساب خود پیگیری کنید.`,
          tone: "info",
        });
        return;
      }
      setMessage({ text: `سفارش ${body.data.orderNumber} ثبت شد.`, tone: "success" });
      router.push(`/checkout/result?order=${encodeURIComponent(body.data.orderNumber)}&status=success`);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <TrackEvent name="begin_checkout" properties={{ metadata: { itemCount: cart.itemCount, subtotal: cart.subtotal } }} />
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold">آدرس تحویل</h2>
          {addresses.length ? (
            <div className="mb-5 flex gap-2">
              <Button type="button" variant={addressMode === "saved" ? "primary" : "outline"} onClick={() => setAddressMode("saved")}>
                آدرسهای ذخیرهشده
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
                این آدرس پیشفرض باشد
              </label>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-lg font-semibold">روش ارسال و پرداخت</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="روش ارسال" htmlFor="co-shipping">
              <Select id="co-shipping" value={shippingMethod} onChange={(e) => setShippingMethod(e.target.value as keyof typeof shippingLabels)}>
                {(Object.keys(shippingLabels) as (keyof typeof shippingLabels)[]).map((key) => (
                  <option key={key} value={key}>{shippingLabels[key]}</option>
                ))}
              </Select>
            </Field>
            <Field label="روش پرداخت" htmlFor="co-payment">
              <Select id="co-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "ONLINE" | "COD")}>
                <option value="ONLINE">پرداخت آنلاین</option>
                <option value="COD">پرداخت هنگام تحویل</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="کد تخفیف (اختیاری)" htmlFor="co-coupon" hint="کد در سرور بررسی و محاسبه میشود">
                <Input id="co-coupon" dir="ltr" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="ILKAII10" />
              </Field>
            </div>
          </div>
        </Card>
      </div>

      <Card className="h-fit p-6">
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
          <div className="flex justify-between"><dt className="text-ink/60">ارسال</dt><dd dir="ltr">{shippingCost === 0 ? "رایگان" : formatToman(shippingCost)}</dd></div>
          <div className="flex justify-between border-t border-line pt-4 text-base font-semibold">
            <dt>برآورد مبلغ</dt><dd dir="ltr" className="text-primary">{formatToman(cart.subtotal + shippingCost)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-ink/50">تخفیف احتمالی در تأیید نهایی سرور اعمال میشود.</p>
        {message ? <div className="mt-4"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
          {busy ? "در حال ثبت سفارش..." : "تأیید و پرداخت"}
        </Button>
      </Card>
    </form>
  );
}
