import type { ReactNode } from "react";
import Link from "next/link";
import { requirePageUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/sign-out-button";
import { Breadcrumbs } from "@/components/ui/display";

const links = [
  { href: "/account", label: "نمای کلی" },
  { href: "/account/orders", label: "سفارشها" },
  { href: "/account/addresses", label: "آدرسها" },
  { href: "/account/wishlist", label: "علاقهمندیها" },
  { href: "/account/reviews", label: "نظرات من" },
  { href: "/account/returns", label: "درخواستهای بازگشت" },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser();
  return (
    <div className="container-luxury py-10">
      <Breadcrumbs items={[{ label: "حساب من" }]} />
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="منوی حساب" className="h-fit space-y-1 rounded-luxury border border-line bg-surface p-4">
          <p className="px-3 pb-3 text-xs text-ink/50">{user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.phone}</p>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="flex min-h-11 items-center rounded-xl px-3 text-sm hover:bg-line/60">
              {link.label}
            </Link>
          ))}
          <div className="border-t border-line pt-2"><SignOutButton /></div>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
