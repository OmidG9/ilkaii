import type { ReactNode } from "react";
import { requirePageUser } from "@/lib/auth/session";
import { SignOutButton } from "@/components/sign-out-button";
import { AccountNav } from "@/components/account-nav";
import { Breadcrumbs } from "@/components/ui/display";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requirePageUser();
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.phone;
  const initial = (user.firstName ?? user.phone).slice(0, 1);

  return (
    <div className="container-luxury py-10">
      <Breadcrumbs items={[{ label: "حساب من" }]} />
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside aria-label="منوی حساب" className="h-fit overflow-hidden rounded-luxury border border-line bg-surface lg:sticky lg:top-28">
          <div className="border-b border-line bg-canvas p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">{initial}</span>
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-semibold">{name}</p>
                <p dir="ltr" className="mt-0.5 text-[10px] text-ink/40">{user.phone}</p>
              </div>
            </div>
            <p className="mt-4 text-[10px] leading-5 text-ink/40">خوش آمدید؛ اینجا سفارش‌ها و ترجیح‌های شماست.</p>
          </div>
          <div className="p-3">
            <AccountNav />
            <div className="mt-2 border-t border-line pt-2"><SignOutButton /></div>
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
