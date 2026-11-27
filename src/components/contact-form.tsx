"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/display";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const subjects = [
  "پیگیری سفارش",
  "تعویض یا بازگشت",
  "مشاورهٔ سایز و استایل",
  "همکاری و عمده‌فروشی",
  "پیشنهاد یا انتقاد",
  "سایر",
];

export function ContactForm({ email }: { email: string }) {
  const [state, setState] = useState({ name: "", email: "", subject: subjects[0], message: "" });
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const body = [
          `نام: ${state.name}`,
          `ایمیل تماس: ${state.email}`,
          `موضوع: ${state.subject}`,
          "",
          state.message,
        ].join("\n");
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(`[${state.subject}] پیام از سایت`)}&body=${encodeURIComponent(body)}`;
        setNotice("کلاینت ایمیل شما باز شد. اگر باز نشد، می‌توانید از آدرس ایمیل کنار صفحه استفاده کنید.");
      }}
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="نام و نام خانوادگی" htmlFor="contact-name">
          <Input id="contact-name" required value={state.name} onChange={(event) => setState({ ...state, name: event.target.value })} placeholder="نام شما" />
        </Field>
        <Field label="ایمیل" htmlFor="contact-email">
          <Input id="contact-email" type="email" dir="ltr" required value={state.email} onChange={(event) => setState({ ...state, email: event.target.value })} placeholder="you@example.com" />
        </Field>
      </div>
      <Field label="موضوع" htmlFor="contact-subject">
        <Select id="contact-subject" value={state.subject} onChange={(event) => setState({ ...state, subject: event.target.value })}>
          {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
        </Select>
      </Field>
      <Field label="پیام" htmlFor="contact-message" hint="شمارهٔ سفارش یا جزئیات بیشتر، پاسخ‌گویی را سریع‌تر می‌کند.">
        <Textarea id="contact-message" required rows={6} value={state.message} onChange={(event) => setState({ ...state, message: event.target.value })} placeholder="چطور می‌توانیم کمک کنیم؟" />
      </Field>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg"><Send className="h-4 w-4" /> ارسال پیام</Button>
        <p className="flex items-center gap-2 text-xs text-ink/45"><Mail className="h-3.5 w-3.5" /> پاسخ در ساعات کاری، حداکثر یک روز کاری</p>
      </div>
    </form>
  );
}
