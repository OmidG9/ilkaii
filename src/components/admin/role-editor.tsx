"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, ShieldCheck } from "lucide-react";
import { ADMIN_ROLE_META } from "@/lib/role-meta";
import { EDITOR_PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS } from "@/lib/permissions";
import { AdminModal } from "@/components/admin/admin-client";
import { ConfirmButton } from "@/components/admin/admin-client";
import { Alert } from "@/components/ui/display";
import { Button, buttonStyles } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

export interface RoleRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
}

const grouped = Object.entries(PERMISSION_GROUPS).map(([group, label]) => ({
  group,
  label,
  permissions: EDITOR_PERMISSIONS.filter((key) => key.startsWith(`${group}.`)),
}));

export function RoleEditor({ roles }: { roles: RoleRow[] }) {
  const router = useRouter();
  const [selectedCode, setSelectedCode] = useState(roles[0]?.code ?? "");
  const selected = useMemo(() => roles.find((role) => role.code === selectedCode) ?? roles[0], [roles, selectedCode]);
  const [checks, setChecks] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", description: "" });

  useEffect(() => {
    setChecks(new Set((selected?.permissions ?? []).filter((key) => (EDITOR_PERMISSIONS as readonly string[]).includes(key))));
    setMessage(null);
  }, [selected]);

  const toggle = (key: string) => {
    setChecks((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const save = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/roles/${selected.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ permissions: [...checks] }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره دسترسی‌ها ناموفق بود");
      setMessage({ tone: "success", text: "دسترسی‌های نقش ذخیره شد." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally {
      setBusy(false);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: form.code, name: form.name, description: form.description, permissions: [...checks] }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ایجاد نقش ناموفق بود");
      setCreateOpen(false);
      setForm({ code: "", name: "", description: "" });
      setMessage({ tone: "success", text: "نقش سفارشی ایجاد شد." });
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally {
      setBusy(false);
    }
  };

  const isSuperAdmin = selected?.code === "SUPER_ADMIN";
  return (
    <div className="grid gap-5 xl:grid-cols-[280px_1fr]">
      <aside className="admin-panel h-fit p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <h2 className="text-xs font-semibold text-ink/60">نقش‌ها</h2>
          <button type="button" onClick={() => setCreateOpen(true)} aria-label="نقش جدید" className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="space-y-1">
          {roles.map((role) => (
            <button key={role.code} type="button" onClick={() => setSelectedCode(role.code)} data-active={role.code === selected?.code} className="admin-nav-link w-full text-right">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs">{role.name}</span>
                <span dir="ltr" className="block text-[10px] text-ink/35">{role.code}</span>
              </span>
              <span className="text-[10px] text-ink/40">{role.userCount}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="admin-panel p-5">
        {selected ? (
          <>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="mt-1 text-xs text-ink/50">{selected.description ?? "بدون توضیح"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="admin-chip">{selected.userCount} کاربر</span>
                  <span className="admin-chip" dir="ltr">{selected.code}</span>
                  {selected.isSystem ? <span className="admin-chip">سیستمی</span> : <span className="admin-chip">سفارشی</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!selected.isSystem ? (
                  <ConfirmButton endpoint={`/api/admin/roles/${selected.id}`} method="DELETE" label="حذف نقش" confirmText="این نقش حذف شود؟ این عمل بازگشت‌ناپذیر است." />
                ) : null}
                <Button type="button" size="sm" onClick={save} disabled={busy || isSuperAdmin}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}ذخیره
                </Button>
              </div>
            </div>

            {isSuperAdmin ? <Alert tone="info">دسترسی‌های مدیرکل ثابت و کامل است و قابل ویرایش نیست.</Alert> : null}
            {ADMIN_ROLE_META[selected.code] ? <p className="mb-4 rounded-xl bg-primary/5 px-3 py-2 text-[11px] text-ink/55">{ADMIN_ROLE_META[selected.code]}</p> : null}

            <div className="grid gap-4 md:grid-cols-2">
              {grouped.map((group) => (
                <fieldset key={group.group} className="rounded-2xl border border-line p-4">
                  <legend className="px-1 text-xs font-semibold text-ink/70">{group.label}</legend>
                  <div className="mt-2 space-y-2">
                    {group.permissions.map((key) => (
                      <label key={key} className="flex min-h-8 items-center gap-2 text-xs text-ink/65">
                        <input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={checks.has(key)} disabled={isSuperAdmin} onChange={() => toggle(key)} />
                        {PERMISSION_LABELS[key] ?? key}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            {message ? <div className="mt-4"><Alert tone={message.tone === "success" ? "success" : "error"}>{message.text}</Alert></div> : null}
          </>
        ) : <p className="text-sm text-ink/50">نقشی وجود ندارد.</p>}
      </section>

      <AdminModal open={createOpen} onClose={() => setCreateOpen(false)} title="نقش سفارشی جدید" description="کد نقش پس از ایجاد قابل تغییر نیست و باید با حروف بزرگ انگلیسی باشد.">
        <form onSubmit={create} className="space-y-4">
          <Field label="کد نقش" htmlFor="role-code"><Input id="role-code" dir="ltr" required pattern="[A-Za-z0-9_]{3,40}" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="STORE_MANAGER" /></Field>
          <Field label="نام نمایشی" htmlFor="role-name"><Input id="role-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="توضیح" htmlFor="role-desc"><Textarea id="role-desc" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
          <p className="text-[11px] text-ink/45">دسترسی‌های انتخاب‌شده از نقش فعلی کپی می‌شوند و بعداً قابل ویرایش هستند.</p>
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonStyles("ghost", "sm")} onClick={() => setCreateOpen(false)}>لغو</button>
            <button type="submit" className={buttonStyles("primary", "sm")} disabled={busy}>{busy ? "در حال ایجاد…" : "ایجاد نقش"}</button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
