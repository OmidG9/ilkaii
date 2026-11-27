"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutDashboard, MapPin, Package, RotateCcw, Star } from "lucide-react";

const links = [
  { href: "/account", label: "نمای کلی", icon: LayoutDashboard },
  { href: "/account/orders", label: "سفارش‌ها", icon: Package },
  { href: "/account/addresses", label: "آدرس‌ها", icon: MapPin },
  { href: "/account/wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
  { href: "/account/reviews", label: "نظرات من", icon: Star },
  { href: "/account/returns", label: "بازگشت‌ها", icon: RotateCcw },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="منوی حساب" className="space-y-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === "/account" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors ${
              active ? "bg-primary/10 font-semibold text-primary" : "text-ink/65 hover:bg-line/50 hover:text-ink"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
