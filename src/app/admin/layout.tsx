import type { ReactNode } from "react";
import Link from "next/link";
import { requirePageAdmin } from "@/lib/auth/session";
import { getSiteConfig } from "@/config/site";
import { SignOutButton } from "@/components/sign-out-button";
import { roleLabels } from "@/lib/labels";

const sections = [
  { title: "کلی", links: [
    { href: "/admin", label: "نمای کلی" },
    { href: "/admin/audit", label: "گزارشها" },
    { href: "/admin/settings", label: "تنظیمات سایت" },
  ] },
  { title: "فروشگاه", links: [
    { href: "/admin/products", label: "محصولات" },
    { href: "/admin/categories", label: "دستهبندیها" },
    { href: "/admin/brands", label: "برندها" },
    { href: "/admin/inventory", label: "موجودی" },
    { href: "/admin/reviews", label: "نظرات" },
  ] },
  { title: "فروش", links: [
    { href: "/admin/orders", label: "سفارشها" },
    { href: "/admin/returns", label: "بازگشتها" },
    { href: "/admin/customers", label: "مشتریان" },
    { href: "/admin/coupons", label: "کدهای تخفیف" },
  ] },
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [user, site] = await Promise.all([requirePageAdmin(), getSiteConfig()]);
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[260px_1fr]">
        <aside className="h-fit border-b border-line bg-surface p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-l lg:overflow-y-auto">
          <Link href="/" className="font-display text-2xl font-bold text-primary">{site.name}</Link>
          <p className="mt-1 text-xs text-ink/50">پنل مدیریت</p>
          <p className="mt-4 rounded-xl bg-primary/5 px-3 py-2 text-xs text-primary">{roleLabels[user.role]}</p>
          <nav aria-label="مدیریت" className="mt-6 space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-2 px-3 text-[11px] font-semibold text-ink/40">{section.title}</h2>
                <div className="space-y-1">
                  {section.links.map((link) => (
                    <Link key={link.href} href={link.href} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-line/60">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-8 border-t border-line pt-4">
            <Link href="/" className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-line/60">بازگشت به فروشگاه</Link>
            <SignOutButton />
          </div>
        </aside>
        <main className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
