"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { AdminModal, ConfirmButton } from "@/components/admin/admin-client";
import { Alert } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { homepageSectionLabels } from "@/lib/labels";
import { formatJalali } from "@/lib/persian";

export interface SectionRow {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  config: unknown;
  displayOrder: number;
  isEnabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string;
}

const TYPES = Object.keys(homepageSectionLabels);
const TEMPLATES: Record<string, unknown> = {
  HERO: { heading: "استایلی که متعلق به شماست", subheading: "مجموعه جدید فصل", ctaLabel: "مشاهده مجموعه", ctaHref: "/shop", align: "start" },
  BANNER: { image: "/uploads/example.webp", alt: "بنر", href: "/shop", ctaLabel: "مشاهده" },
  FEATURED_CATEGORIES: { categoryIds: [], limit: 5, ctaLabel: "همه دسته‌ها", ctaHref: "/shop" },
  FEATURED_PRODUCTS: { productIds: [], limit: 4, ctaLabel: "همه محصولات", ctaHref: "/shop" },
  NEW_ARRIVALS: { limit: 4, ctaLabel: "مشاهده جدیدها", ctaHref: "/shop?newArrival=true" },
  BEST_SELLERS: { limit: 4, ctaLabel: "پرفروش‌ها", ctaHref: "/shop?sort=popular" },
  PROMOTIONAL: { heading: "مجموعه تازه", text: "متن کوتاه کمپین", ctaLabel: "خرید", ctaHref: "/shop", tone: "primary" },
  SEASONAL_COLLECTION: { heading: "کلکسیون فصل", text: "متن کوتاه", ctaLabel: "مشاهده", ctaHref: "/shop" },
  TESTIMONIALS: { items: [{ name: "مشتری", text: "تجربه خرید عالی", rating: 5 }] },
  CUSTOM_CONTENT: { heading: "درباره مجموعه", body: "متن دلخواه", ctaLabel: "بیشتر", ctaHref: "/about" },
};

type FormState = {
  type: string; title: string; subtitle: string; config: string; displayOrder: string;
  isEnabled: boolean; startsAt: string; endsAt: string;
};

function local(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function HomepageBuilder({ sections }: { sections: SectionRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState<FormState>({ type: "HERO", title: "", subtitle: "", config: JSON.stringify(TEMPLATES.HERO, null, 2), displayOrder: "0", isEnabled: true, startsAt: "", endsAt: "" });

  const startCreate = () => {
    setEditingId(null);
    setForm({ type: "HERO", title: "", subtitle: "", config: JSON.stringify(TEMPLATES.HERO, null, 2), displayOrder: String(sections.length), isEnabled: true, startsAt: "", endsAt: "" });
    setMessage(null);
    setOpen(true);
  };

  const startEdit = (section: SectionRow) => {
    setEditingId(section.id);
    setForm({
      type: section.type, title: section.title ?? "", subtitle: section.subtitle ?? "",
      config: JSON.stringify(section.config, null, 2), displayOrder: String(section.displayOrder),
      isEnabled: section.isEnabled, startsAt: local(section.startsAt), endsAt: local(section.endsAt),
    });
    setMessage(null);
    setOpen(true);
  };

  const changeType = (type: string) => {
    setForm((current) => ({ ...current, type, config: JSON.stringify(TEMPLATES[type] ?? {}, null, 2) }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      let config: unknown;
      try { config = JSON.parse(form.config); } catch { throw new Error("تنظیمات JSON معتبر نیست"); }
      const payload = {
        type: form.type,
        title: form.title || undefined,
        subtitle: form.subtitle || undefined,
        config,
        displayOrder: Number(form.displayOrder) || 0,
        isEnabled: form.isEnabled,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
      };
      const response = await fetch(editingId ? `/api/admin/cms/homepage/${editingId}` : "/api/admin/cms/homepage", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره بخش ناموفق بود");
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const ids = sections.map((section) => section.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    setBusy(true);
    try {
      await fetch("/api/admin/cms/homepage/reorder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ids }) });
      router.refresh();
    } finally { setBusy(false); }
  };

  const toggle = async (section: SectionRow) => {
    setBusy(true);
    try {
      await fetch(`/api/admin/cms/homepage/${section.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isEnabled: !section.isEnabled }) });
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">بخش‌های صفحه اصلی</h2>
          <p className="mt-1 text-[11px] text-ink/45">ترتیب، فعال‌سازی و زمان‌بندی بخش‌ها را مدیریت کنید. تنظیمات با طرح‌واره اعتبارسنجی می‌شود و HTML دلخواه اجرا نمی‌شود.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-line px-4 text-sm hover:border-primary"><ExternalLink className="h-4 w-4" />پیش‌نمایش فروشگاه</Link>
          <Button type="button" size="sm" onClick={startCreate}><Plus className="h-4 w-4" />بخش جدید</Button>
        </div>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <div key={section.id} className="admin-panel flex flex-wrap items-center gap-3 p-4">
            <div className="flex flex-col gap-1">
              <button type="button" aria-label="بالا" disabled={busy || index === 0} onClick={() => move(index, -1)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line hover:border-primary disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
              <button type="button" aria-label="پایین" disabled={busy || index === sections.length - 1} onClick={() => move(index, 1)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line hover:border-primary disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{homepageSectionLabels[section.type] ?? section.type}</span>
                {section.title ? <span className="text-xs font-medium">{section.title}</span> : null}
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${section.isEnabled ? "bg-emerald-500/10 text-emerald-700" : "bg-line text-ink/45"}`}>{section.isEnabled ? "فعال" : "غیرفعال"}</span>
              </div>
              <p className="mt-1 text-[10px] text-ink/40">ترتیب {section.displayOrder} — آخرین ویرایش {formatJalali(section.updatedAt, true)} {section.startsAt ? `— شروع ${formatJalali(section.startsAt)}` : ""}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => toggle(section)} disabled={busy} aria-label="فعال/غیرفعال" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-line/60"><Power className={`h-4 w-4 ${section.isEnabled ? "text-emerald-600" : "text-ink/40"}`} /></button>
              <button type="button" onClick={() => startEdit(section)} aria-label="ویرایش" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-line/60"><Pencil className="h-4 w-4" /></button>
              <ConfirmButton endpoint={`/api/admin/cms/homepage/${section.id}`} method="DELETE" label={<Trash2 className="h-4 w-4" />} confirmText="این بخش حذف شود؟" variant="ghost" size="sm" />
            </div>
          </div>
        ))}
        {!sections.length ? <div className="rounded-2xl border border-dashed border-line p-10 text-center text-xs text-ink/45">هنوز بخشی ساخته نشده است؛ صفحه اصلی از طرح پیش‌فرض استفاده می‌کند.</div> : null}
      </div>

      <AdminModal open={open} onClose={() => setOpen(false)} title={editingId ? "ویرایش بخش" : "افزودن بخش"} wide>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="نوع بخش" htmlFor="sec-type">
            <Select id="sec-type" value={form.type} onChange={(event) => changeType(event.target.value)}>
              {TYPES.map((type) => <option key={type} value={type}>{homepageSectionLabels[type] ?? type}</option>)}
            </Select>
          </Field>
          <Field label="ترتیب نمایش" htmlFor="sec-order"><Input id="sec-order" type="number" dir="ltr" min={0} value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} /></Field>
          <Field label="عنوان (اختیاری)" htmlFor="sec-title"><Input id="sec-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
          <Field label="زیرعنوان (اختیاری)" htmlFor="sec-subtitle"><Input id="sec-subtitle" value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} /></Field>
          <Field label="شروع نمایش" htmlFor="sec-start"><Input id="sec-start" type="datetime-local" dir="ltr" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></Field>
          <Field label="پایان نمایش" htmlFor="sec-end"><Input id="sec-end" type="datetime-local" dir="ltr" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="تنظیمات بخش (JSON)" hint="فقط فیلدهای مجاز هر نوع پذیرفته می‌شوند. متن‌ها به‌صورت امن و escape شده رندر می‌شوند." htmlFor="sec-config">
              <Textarea id="sec-config" rows={12} dir="ltr" required value={form.config} onChange={(event) => setForm({ ...form, config: event.target.value })} />
            </Field>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={form.isEnabled} onChange={(event) => setForm({ ...form, isEnabled: event.target.checked })} />فعال باشد</label>
          {message ? <div className="sm:col-span-2"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
          <div className="sm:col-span-2 flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm text-ink/60 hover:bg-line/60">لغو</button>
            <Button type="submit" size="sm" disabled={busy}>{busy ? "در حال ذخیره…" : "ذخیره"}</Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
