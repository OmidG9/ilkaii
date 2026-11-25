"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Field, Input } from "@/components/ui/field";

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  color: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export function ImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const mutate = async (path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(path, {
        method,
        headers: body === undefined ? undefined : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message ?? "عملیات ناموفق بود");
      setMessage({ text: "تصویر بهروز شد.", tone: "success" });
      setUrl("");
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const upload = async (file: File) => {
    setBusy(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message ?? "بارگذاری ناموفق بود");
      await mutate(`/api/admin/products/${productId}/images`, "POST", { url: data.data.url });
    } catch (error) {
      setBusy(false);
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-lg font-semibold">تصاویر محصول</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((image) => (
          <div key={image.id} className="rounded-2xl border border-line p-3">
            <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-line/20">
              <Image src={image.url} alt={image.altText ?? ""} fill sizes="(max-width: 640px) 90vw, 45vw" className="object-cover" unoptimized />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink/60">{image.isPrimary ? "تصویر اصلی" : `ترتیب ${image.displayOrder + 1}`}</span>
              <div className="flex gap-1">
                {!image.isPrimary ? (
                  <button type="button" aria-label="تنظیم به عنوان تصویر اصلی" disabled={busy}
                    onClick={() => mutate(`/api/admin/products/${productId}/images/${image.id}`, "PATCH")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-line/60">
                    <Star className="h-4 w-4" />
                  </button>
                ) : null}
                <button type="button" aria-label="حذف تصویر" disabled={busy}
                  onClick={() => mutate(`/api/admin/products/${productId}/images/${image.id}`, "DELETE")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!images.length ? <p className="text-sm text-ink/55">هنوز تصویری اضافه نشده است.</p> : null}
      </div>

      <div className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
        <Field label="افزودن با آدرس تصویر" htmlFor="img-url" hint="آدرس تصویر معتبر (http/https)">
          <div className="flex gap-2">
            <Input id="img-url" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            <Button type="button" disabled={busy || !url} onClick={() => mutate(`/api/admin/products/${productId}/images`, "POST", { url })}>افزودن</Button>
          </div>
        </Field>
        <Field label="بارگذاری فایل" htmlFor="img-file" hint="JPEG، PNG یا WebP تا ۵ مگابایت">
          <label htmlFor="img-file" className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-primary px-5 text-sm text-primary">
            <Upload className="h-4 w-4" />انتخاب فایل
            <input id="img-file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
          </label>
        </Field>
      </div>
      {message ? <div className="mt-5"><Alert tone={message.tone}>{message.text}</Alert></div> : null}
    </Card>
  );
}
