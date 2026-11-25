"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminModal, ConfirmButton } from "@/components/admin/admin-client";
import { Alert, Card } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { menuLocationLabels } from "@/lib/labels";

export interface MenuItemRow {
  id: string; parentId: string | null; label: string; href: string; target: string;
  displayOrder: number; isActive: boolean;
}
export interface MenuRow { id: string; location: "HEADER" | "FOOTER" | "MOBILE"; name: string; items: MenuItemRow[] }

const LOCATIONS = ["HEADER", "MOBILE", "FOOTER"] as const;

function flatten(items: MenuItemRow[], parentId: string | null = null, depth = 0): Array<MenuItemRow & { depth: number }> {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .flatMap((item) => [{ ...item, depth }, ...flatten(items, item.id, depth + 1)]);
}

type FormState = { label: string; href: string; parentId: string; target: string; displayOrder: string; isActive: boolean };
const blank: FormState = { label: "", href: "/", parentId: "", target: "_self", displayOrder: "0", isActive: true };

export function MenuManager({ menus }: { menus: MenuRow[] }) {
  const router = useRouter();
  const [location, setLocation] = useState<(typeof LOCATIONS)[number]>("HEADER");
  const menu = menus.find((item) => item.location === location);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const flat = useMemo(() => menu ? flatten(menu.items) : [], [menu]);

  const createMenu = async () => {
    setBusy(true);
    try {
      await fetch("/api/admin/cms/menus", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ location }) });
      router.refresh();
    } finally { setBusy(false); }
  };

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...blank, displayOrder: String(menu?.items.length ?? 0) });
    setMessage(null);
    setOpen(true);
  };

  const startEdit = (item: MenuItemRow) => {
    setEditingId(item.id);
    setForm({ label: item.label, href: item.href, parentId: item.parentId ?? "", target: item.target, displayOrder: String(item.displayOrder), isActive: item.isActive });
    setMessage(null);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!menu) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = {
        menuId: menu.id, label: form.label, href: form.href, target: form.target,
        parentId: form.parentId || undefined, displayOrder: Number(form.displayOrder) || 0, isActive: form.isActive,
      };
      const response = await fetch(editingId ? `/api/admin/cms/menus/items/${editingId}` : "/api/admin/cms/menus/items", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, parentId: form.parentId || null } : payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره آیتم ناموفق بود");
      setOpen(false);
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally { setBusy(false); }
  };

  const move = async (item: MenuItemRow, direction: -1 | 1) => {
    if (!menu) return;
    const siblings = menu.items.filter((entry) => entry.parentId === item.parentId).sort((a, b) => a.displayOrder - b.displayOrder);
    const index = siblings.findIndex((entry) => entry.id === item.id);
    const target = index + direction;
    if (target < 0 || target >= siblings.length) return;
    [siblings[index], siblings[target]] = [siblings[target]!, siblings[index]!];
    setBusy(true);
    try {
      await fetch("/api/admin/cms/menus/reorder", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ menuId: menu.id, ids: siblings.map((entry) => entry.id) }) });
      router.refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {LOCATIONS.map((item) => (
            <button key={item} type="button" onClick={() => setLocation(item)} data-active={location === item}
              className={`min-h-9 rounded-xl border px-4 text-xs ${location === item ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink/60 hover:border-primary"}`}>
              {menuLocationLabels[item]}
            </button>
          ))}
        </div>
        {menu ? <Button type="button" size="sm" onClick={startCreate}><Plus className="h-4 w-4" />آیتم جدید</Button> : null}
      </div>

      {!menu ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-sm text-ink/55">برای این جایگاه منویی ساخته نشده است.</p>
          <Button type="button" size="sm" className="mt-3" onClick={createMenu} disabled={busy}><Plus className="h-4 w-4" />ساخت منو</Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="table-wrap border-0">
            <table className="table-luxury">
              <thead><tr><th>عنوان</th><th>لینک</th><th>هدف</th><th>ترتیب</th><th>وضعیت</th><th>عملیات</th></tr></thead>
              <tbody>
                {flat.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="text-xs font-medium" style={{ paddingInlineStart: `${item.depth * 18}px` }}>
                        {item.depth ? "↳ " : ""}{item.label}
                      </span>
                    </td>
                    <td><span dir="ltr" className="block max-w-64 truncate text-[10px] text-ink/55">{item.href}</span></td>
                    <td className="text-[10px]">{item.target === "_blank" ? "تب جدید" : "همین صفحه"}</td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => move(item, -1)} disabled={busy} aria-label="بالا" className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line hover:border-primary disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                        <button type="button" onClick={() => move(item, 1)} disabled={busy} aria-label="پایین" className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-line hover:border-primary disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                      </div>
                    </td>
                    <td><span className={`rounded-full px-2 py-0.5 text-[10px] ${item.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-line text-ink/45"}`}>{item.isActive ? "فعال" : "غیرفعال"}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => startEdit(item)} aria-label="ویرایش" className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-line/60"><Pencil className="h-4 w-4" /></button>
                        <ConfirmButton endpoint={`/api/admin/cms/menus/items/${item.id}`} method="DELETE" label={<Trash2 className="h-4 w-4" />} confirmText="این آیتم منو حذف شود؟" variant="ghost" size="sm" />
                      </div>
                    </td>
                  </tr>
                ))}
                {!flat.length ? <tr><td colSpan={6} className="py-10 text-center text-xs text-ink/45">آیتمی در این منو نیست.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AdminModal open={open} onClose={() => setOpen(false)} title={editingId ? "ویرایش آیتم منو" : "آیتم جدید"}>
        <form onSubmit={submit} className="space-y-4">
          <Field label="عنوان" htmlFor="mi-label"><Input id="mi-label" required value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} /></Field>
          <Field label="لینک" htmlFor="mi-href" hint="لینک داخلی مانند /shop یا آدرس کامل https://"><Input id="mi-href" required dir="ltr" value={form.href} onChange={(event) => setForm({ ...form, href: event.target.value })} /></Field>
          <Field label="منوی والد" htmlFor="mi-parent">
            <Select id="mi-parent" value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
              <option value="">بدون والد</option>
              {flat.filter((item) => item.id !== editingId).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="باز شدن" htmlFor="mi-target">
              <Select id="mi-target" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })}>
                <option value="_self">همین صفحه</option>
                <option value="_blank">تب جدید</option>
              </Select>
            </Field>
            <Field label="ترتیب" htmlFor="mi-order"><Input id="mi-order" type="number" dir="ltr" min={0} value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} /></Field>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm"><Checkbox checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />فعال</label>
          {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm text-ink/60 hover:bg-line/60">لغو</button>
            <Button type="submit" size="sm" disabled={busy}>{busy ? "در حال ذخیره…" : "ذخیره"}</Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
