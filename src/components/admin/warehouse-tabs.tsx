"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ClipboardCheck, ClipboardList, History, Truck } from "lucide-react";

const tabs = [
  { href: "/admin/inventory", label: "موجودی", icon: Boxes, exact: true },
  { href: "/admin/inventory/suppliers", label: "تأمین‌کنندگان", icon: Truck },
  { href: "/admin/inventory/purchase-orders", label: "سفارش‌های خرید", icon: ClipboardList },
  { href: "/admin/inventory/stocktakes", label: "انبارگردانی", icon: ClipboardCheck },
  { href: "/admin/inventory/movements", label: "تاریخچه", icon: History },
];

export function WarehouseTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="بخش‌های انبار" className="admin-scroll flex gap-1.5 overflow-x-auto pb-1">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            data-active={active}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-xs ${active ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink/60 hover:border-primary"}`}
          >
            <tab.icon className="h-4 w-4" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
