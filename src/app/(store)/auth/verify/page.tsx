import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Alert, Breadcrumbs } from "@/components/ui/display";

export const metadata: Metadata = { title: "تأیید کد", robots: { index: false } };

export default function VerifyPage() {
  return (
    <div className="container-luxury max-w-xl py-14">
      <Breadcrumbs items={[{ label: "تأیید کد" }]} />
      <div className="mb-5"><Alert>کد تأیید تنها از طریق پیامک ارسال میشود. در محیط توسعه میتوانید کد آزمایشی را در همین صفحه مشاهده کنید.</Alert></div>
      <LoginForm />
    </div>
  );
}
