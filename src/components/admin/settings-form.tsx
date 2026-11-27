"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import type { SiteConfig } from "@/config/site";

type FieldType = "text" | "number" | "color" | "checkbox" | "textarea";
interface SettingField { key: string; label: string; type: FieldType }
interface Group { title: string; fields: SettingField[] }

const groups: Group[] = [
  { title: "هویت فروشگاه", fields: [
    { key: "site.name", label: "نام فروشگاه", type: "text" },
    { key: "site.tagline", label: "شعار", type: "text" },
    { key: "site.description", label: "توضیحات", type: "text" },
    { key: "site.logo", label: "آدرس لوگو", type: "text" },
    { key: "site.locale", label: "زبان/لوکال", type: "text" },
    { key: "site.currency", label: "واحد پول", type: "text" },
    { key: "site.timezone", label: "منطقه زمانی", type: "text" },
  ] },
  { title: "SEO پیش‌فرض", fields: [
    { key: "seo.defaultTitle", label: "عنوان پیش‌فرض", type: "text" },
    { key: "seo.defaultDescription", label: "توضیح پیش‌فرض", type: "textarea" },
  ] },
  { title: "رنگهای پوسته", fields: [
    { key: "theme.primary", label: "رنگ اصلی", type: "color" },
    { key: "theme.secondary", label: "رنگ دوم", type: "color" },
    { key: "theme.background", label: "پسزمینه", type: "color" },
    { key: "theme.text", label: "متن", type: "color" },
    { key: "theme.border", label: "خطوط", type: "color" },
    { key: "theme.hover", label: "رنگ شناور", type: "color" },
  ] },
  { title: "اطلاعات تماس", fields: [
    { key: "contact.email", label: "ایمیل", type: "text" },
    { key: "contact.phone", label: "تلفن", type: "text" },
    { key: "contact.address", label: "آدرس", type: "text" },
  ] },
  { title: "هزینه ارسال (تومان)", fields: [
    { key: "shipping.flat", label: "نرخ ثابت", type: "number" },    { key: "shipping.pishtaz", label: "پست پیشتاز", type: "number" },
    { key: "shipping.tipax", label: "تیپاکس", type: "number" },
    { key: "shipping.freeThreshold", label: "آستانه ارسال رایگان", type: "number" },
  ] },
  { title: "قابلیتها", fields: [
    { key: "features.wishlist", label: "علاقهمندیها", type: "checkbox" },
    { key: "features.reviews", label: "نظرات", type: "checkbox" },
    { key: "features.coupons", label: "کدهای تخفیف", type: "checkbox" },
    { key: "features.sizeGuide", label: "راهنمای سایز", type: "checkbox" },
    { key: "features.newsletter", label: "خبرنامه", type: "checkbox" },
  ] },
  { title: "محتوای صفحات", fields: [
    { key: "content.about", label: "درباره ما", type: "textarea" },
    { key: "content.shippingPolicy", label: "سیاست ارسال", type: "textarea" },
    { key: "content.returnPolicy", label: "سیاست بازگشت", type: "textarea" },
    { key: "content.privacyPolicy", label: "حریم خصوصی", type: "textarea" },
    { key: "content.terms", label: "شرایط و قوانین", type: "textarea" },
  ] },
];

function baseValue(config: SiteConfig, key: string): string {
  const resolved = key.startsWith("site.")
    ? (config as unknown as Record<string, unknown>)[key.slice(5)]
    : key.split(".").reduce<unknown>((acc, part) => {
        if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
        return undefined;
      }, config);
  if (typeof resolved === "boolean") return resolved ? "true" : "false";
  return resolved === null || resolved === undefined ? "" : String(resolved);
}

export function SettingsForm({ config, overrides }: { config: SiteConfig; overrides: Record<string, string> }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.flatMap((group) => group.fields).map((field) => [
      field.key, overrides[field.key] ?? baseValue(config, field.key),
    ])),
  );
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ settings: values }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره تنظیمات ناموفق بود");
      setMessage({ text: "تنظیمات ذخیره شد. تغییرات بلافاصله اعمال میشوند.", tone: "success" });
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {groups.map((group) => (
        <Card key={group.title} className="p-6">
          <h2 className="mb-5 text-lg font-semibold">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : undefined}>
                <Field label={field.label} htmlFor={`st-${field.key}`}>
                  {field.type === "checkbox" ? (
                    <label className="flex min-h-11 items-center gap-2">
                      <Checkbox id={`st-${field.key}`} checked={values[field.key] === "true"}
                        onChange={(e) => setValues({ ...values, [field.key]: e.target.checked ? "true" : "false" })} />
                      <span className="text-sm text-ink/70">فعال</span>
                    </label>
                  ) : field.type === "textarea" ? (
                    <Textarea id={`st-${field.key}`} rows={4} value={values[field.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
                  ) : (
                    <Input id={`st-${field.key}`} type={field.type === "number" ? "number" : field.type === "color" ? "color" : "text"}
                      dir={field.type === "color" || field.type === "number" ? "ltr" : undefined}
                      min={field.type === "number" ? 0 : undefined}
                      value={values[field.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [field.key]: e.target.value })} />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </Card>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={busy}>{busy ? "در حال ذخیره..." : "ذخیره تنظیمات"}</Button>
        {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
      </div>
    </form>
  );
}
