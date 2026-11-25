import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { Breadcrumbs } from "@/components/ui/display";

export const metadata: Metadata = { title: "ورود", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="container-luxury max-w-xl py-14">
      <Breadcrumbs items={[{ label: "ورود" }]} />
      <LoginForm />
    </div>
  );
}
