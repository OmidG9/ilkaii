"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Pencil, Trash2, UploadCloud } from "lucide-react";
import { AdminModal, ConfirmButton } from "@/components/admin/admin-client";
import { Alert } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { formatJalali, formatNumber } from "@/lib/persian";

export interface MediaRow {
  id: string; url: string; altText: string | null; mimeType: string; size: number;
  width: number | null; height: number | null; folder: string | null; createdAt: string;
}

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${formatNumber(Math.round(bytes / 1024))} KB`;
  return `${formatNumber(Math.round((bytes / 1024 / 1024) * 10) / 10)} MB`;
}

export function MediaManager({ assets }: { assets: MediaRow[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [editing, setEditing] = useState<MediaRow | null>(null);
  const [altText, setAltText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setMessage(null);
    try {
      for (const file of Array.from(files).slice(0, 10)) {
        const data = new FormData();
        data.append("file", file);
        const response = await fetch("/api/admin/upload", { method: "POST", body: data });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body?.error?.message ?? `آپلود ${file.name} ناموفق بود`);
      }
      setMessage({ tone: "success", text: "فایل‌ها آپلود و به کتابخانه رسانه اضافه شدند." });
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally { setBusy(false); }
  };

  const saveAlt = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/cms/media/${editing.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: editing.id, altText }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body?.error?.message ?? "ذخیره ناموفق بود");
      setEditing(null);
      router.refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "خطای ارتباطی" });
    } finally { setBusy(false); }
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(url);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="admin-panel flex flex-wrap items-center gap-3 p-4">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => void upload(event.target.files)} />
        <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}آپلود تصویر
        </Button>
        <p className="text-[11px] text-ink/45">حداکثر ۵ مگابایت، JPEG/PNG/WebP؛ فایل‌ها به WebP تبدیل و متادیتا پاک می‌شود.</p>
      </div>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {assets.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((asset) => (
            <figure key={asset.id} className="admin-panel overflow-hidden">
              <div className="relative aspect-[4/3] bg-line/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.altText ?? ""} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <figcaption className="space-y-2 p-3">
                <p className="truncate text-[11px] font-medium">{asset.altText || "بدون توضیح جایگزین"}</p>
                <p dir="ltr" className="truncate text-[9px] text-ink/40">{asset.url}</p>
                <div className="flex items-center justify-between text-[9px] text-ink/40">
                  <span>{humanSize(asset.size)}</span>
                  <span>{formatJalali(asset.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="کپی آدرس" onClick={() => void copy(asset.url)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-line/60">{copied === asset.url ? <span className="text-[9px] text-emerald-600">✓</span> : <Copy className="h-3.5 w-3.5" />}</button>
                  <button type="button" aria-label="ویرایش" onClick={() => { setEditing(asset); setAltText(asset.altText ?? ""); }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-line/60"><Pencil className="h-3.5 w-3.5" /></button>
                  <ConfirmButton endpoint={`/api/admin/cms/media/${asset.id}`} method="DELETE" label={<Trash2 className="h-3.5 w-3.5" />} confirmText="این فایل حذف شود؟ اگر در محتوا استفاده شده باشد حذف نمی‌شود." variant="ghost" size="sm" />
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-ink/45">فایلی در کتابخانه نیست.</div>
      )}

      <AdminModal open={Boolean(editing)} onClose={() => setEditing(null)} title="ویرایش فایل رسانه">
        <div className="space-y-4">
          <Field label="متن جایگزین (alt)" htmlFor="media-alt"><Input id="media-alt" value={altText} onChange={(event) => setAltText(event.target.value)} /></Field>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="min-h-10 rounded-xl px-4 text-sm text-ink/60 hover:bg-line/60">لغو</button><Button type="button" size="sm" onClick={saveAlt} disabled={busy}>ذخیره</Button></div>
        </div>
      </AdminModal>
    </div>
  );
}
