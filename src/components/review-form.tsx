"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/display";
import { Field, Input, Textarea } from "@/components/ui/field";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "info" | "error" | "success" } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, rating, title: title || undefined, comment }),
      });
      const body = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setMessage({ text: "برای ثبت نظر لطفاً وارد شوید.", tone: "error" });
          return;
        }
        throw new Error(body?.error?.message ?? "ثبت نظر ناموفق بود");
      }
      setMessage({ text: "نظر شما ثبت شد و پس از تأیید نمایش داده میشود.", tone: "success" });
      setTitle("");
      setComment("");
      router.refresh();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "خطای ارتباطی", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">نظر خود را ثبت کنید</h2>
      <p className="mb-5 text-xs text-ink/55">
        فقط مشتریانی که این محصول را خریداری کردهاند میتوانند نظر ثبت کنند.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="امتیاز" htmlFor="review-rating">
          <select id="review-rating" className="field" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} ستاره</option>)}
          </select>
        </Field>
        <Field label="عنوان (اختیاری)" htmlFor="review-title">
          <Input id="review-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="نظر شما" htmlFor="review-comment">
          <Textarea id="review-comment" required minLength={10} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        <Button type="submit" disabled={busy || comment.length < 10}>{busy ? "در حال ارسال..." : "ارسال نظر"}</Button>
        {message ? <Alert tone={message.tone}>{message.text} <Link href="/auth/login" className="underline">ورود</Link></Alert> : null}
      </form>
    </Card>
  );
}
