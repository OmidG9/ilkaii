"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { formatJalali } from "@/lib/persian";

export interface SecretMeta {
  key: string;
  label: string;
  group: string;
  configured: boolean;
  maskedHint: string | null;
  updatedAt: string | null;
}

export function IntegrationSecrets({ secrets }: { secrets: SecretMeta[] }) {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState(secrets[0]?.key ?? "");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const active = useMemo(() => secrets.find((secret) => secret.key === activeKey), [secrets, activeKey]);
  const groups = useMemo(() => [...new Set(secrets.map((secret) => secret.group))], [secrets]);

  const save = async (action: "set" | "delete") => {
    if (action === "delete" && !window.confirm("این راز حذف شود؟ سرویس مرتبط غیرفعال می‌شود.")) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/settings/secrets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: activeKey, value: action === "set" ? value : undefined, action }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "عملیات ناموفق بود");
      setValue("");
      setMessage({ tone: "success", text: action === "set" ? "راز به‌صورت رمزنگاری‌شده ذخیره شد." : "راز حذف شد." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
      <aside className="admin-panel h-fit p-3">
        <h2 className="mb-2 px-2 text-xs font-semibold text-ink/60">کلیدهای یکپارچه‌سازی</h2>
        {groups.map((group) => (
          <div key={group} className="mb-3">
            <p className="px-2 py-1 text-[10px] text-ink/35">{group}</p>
            <div className="space-y-1">
              {secrets.filter((secret) => secret.group === group).map((secret) => (
                <button key={secret.key} type="button" onClick={() => { setActiveKey(secret.key); setValue(""); setMessage(null); }} data-active={activeKey === secret.key} className="admin-nav-link w-full text-right">
                  <KeyRound className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs">{secret.label}</span>
                    <span className="block text-[9px] text-ink/35">{secret.configured ? "پیکربندی شده" : "تنظیم نشده"}</span>
                  </span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${secret.configured ? "bg-emerald-500" : "bg-line"}`} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <section className="admin-panel p-6">
        {active ? (
          <div className="max-w-lg space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{active.label}</h2>
              <p dir="ltr" className="mt-1 text-[10px] text-ink/40">{active.key}</p>
              {active.configured ? (
                <p className="mt-2 text-xs text-ink/55">مقدار فعلی: <span dir="ltr" className="font-mono">{active.maskedHint}</span> — آخرین تغییر: {active.updatedAt ? formatJalali(active.updatedAt, true) : "—"}</p>
              ) : <p className="mt-2 text-xs text-ink/45">هنوز مقداری ثبت نشده است.</p>}
            </div>
            <Field label="مقدار جدید" hint="پس از ذخیره، مقدار کامل دیگر در رابط کاربری نمایش داده نمی‌شود." htmlFor="secret-value">
              <Input id="secret-value" type="password" dir="ltr" autoComplete="new-password" value={value} onChange={(event) => setValue(event.target.value)} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={busy || !value} onClick={() => void save("set")}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}ذخیره رمزنگاری‌شده</Button>
              {active.configured ? <Button type="button" size="sm" variant="danger" disabled={busy} onClick={() => void save("delete")}><Trash2 className="h-4 w-4" />حذف</Button> : null}
            </div>
            {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
            <p className="rounded-xl bg-canvas p-3 text-[10px] leading-5 text-ink/45">
              رازها با AES-256-GCM و کلید مشتق‌شده از SESSION_SECRET رمزنگاری می‌شوند. پس از تغییر SESSION_SECRET، باید همه رازها دوباره وارد شوند. مقدار کامل هرگز به مرورگر ارسال نمی‌شود.
            </p>
          </div>
        ) : <p className="text-sm text-ink/50">کلیدی موجود نیست.</p>}
      </section>
    </div>
  );
}
