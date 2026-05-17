import Link from "next/link";
import { FA } from "@/lib/translations";

const errorMessages: Record<string, string> = {
  CredentialsSignin: "شماره یا کد تایید اشتباه است.",
  SessionRequired: "برای دسترسی باید ابتدا وارد شوید.",
  AccessDenied: "دسترسی شما محدود شده است.",
  default: "خطایی رخ داده است. لطفاً دوباره تلاش کنید.",
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams?: any;
}) {
  const errorKey = searchParams.error || "default";
  const message = errorMessages[errorKey] || errorMessages.default;

  return (
    <div className="min-h-screen bg-luxury-background py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-xl rounded-[32px] border border-luxury-border bg-white p-8 shadow-sm text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-luxury-text/50">
            {FA.common.error}
          </p>
          <h1 className="mt-4 text-3xl font-serif font-bold text-luxury-primary">
            مشکلی پیش آمد
          </h1>
          <p className="mt-4 text-base text-luxury-text/70">{message}</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-3xl bg-luxury-primary px-6 py-4 text-base font-semibold text-white transition hover:bg-luxury-hover"
            >
              بازگشت به ورود
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-3xl border border-luxury-border bg-luxury-background px-6 py-4 text-base font-semibold text-luxury-text transition hover:border-luxury-primary"
            >
              بازگشت به خانه
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
