import Link from "next/link";
import { ArrowRight, LayoutDashboard, SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/display";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-xl p-8 text-center sm:p-12">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <SearchX className="h-6 w-6" />
        </span>
        <p className="mt-6 text-[10px] tracking-[0.32em] text-ink/35">ADMIN / 404</p>
        <h1 className="mt-3 text-2xl font-semibold">این بخش در کنترل‌سنتر وجود ندارد</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink/55">
          آدرس مدیریت نامعتبر است یا دسترسی این بخش تغییر کرده. از داشبورد اصلی یا جستجوی سراسری استفاده کنید.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/admin/dashboard"><LayoutDashboard className="h-4 w-4" /> داشبورد</ButtonLink>
          <ButtonLink href="/admin/search" variant="outline"><SearchX className="h-4 w-4" /> جستجو</ButtonLink>
        </div>
        <Link href="/" className="mt-6 inline-flex items-center gap-1 text-xs text-ink/45 hover:text-primary">
          بازگشت به فروشگاه <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>
    </div>
  );
}
