"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity, BarChart3, Bell, Boxes, ChevronDown, ChevronLeft, ClipboardCheck, ClipboardList,
  FileBarChart, FileText, FolderTree, HeartPulse, History, Image as ImageIcon, Images, KeyRound,
  LayoutDashboard, LayoutTemplate, LogOut, Mail, Megaphone, Menu, MessageSquare, Moon, Navigation,
  Newspaper, Package, PanelBottom, PanelsTopLeft, Plus, RotateCcw, ScrollText, Search, Send,
  Settings, ShieldCheck, ShoppingBag, ShoppingCart, Sun, Tag, TicketPercent, Truck, UserCog, Users, X,
} from "lucide-react";
import type { AdminNavSection, AdminNotification } from "@/lib/admin-navigation";
import type { AdminBadges } from "@/services/notifications";
import { formatNumber } from "@/lib/persian";

const ICONS: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, FileBarChart, ShoppingBag, RotateCcw, Users, Package, FolderTree, Tag, Boxes,
  MessageSquare, PanelsTopLeft, FileText, LayoutTemplate, Image: ImageIcon, Navigation, Images,
  Newspaper, PanelBottom, Megaphone, Send, Mail, ShoppingCart, TicketPercent, BarChart3,
  Activity, Settings, UserCog, ShieldCheck, KeyRound, ScrollText, HeartPulse,
  Truck, ClipboardList, ClipboardCheck, History,
};

const PATH_LABELS: Record<string, string> = {
  admin: "مدیریت",
  dashboard: "داشبورد",
  orders: "سفارش‌ها",
  returns: "مرجوعی‌ها",
  customers: "مشتریان",
  products: "محصولات",
  categories: "دسته‌بندی‌ها",
  brands: "برندها",
  inventory: "موجودی",
  suppliers: "تأمین‌کنندگان",
  "purchase-orders": "سفارش‌های خرید",
  stocktakes: "انبارگردانی",
  movements: "تاریخچه موجودی",
  new: "جدید",
  edit: "ویرایش",
  reviews: "نظرات",
  cms: "مدیریت محتوا",
  pages: "صفحات",
  homepage: "صفحه اصلی",
  banners: "بنرها",
  menus: "منوها",
  media: "رسانه",
  blog: "وبلاگ",
  footer: "پایین صفحه",
  marketing: "بازاریابی",
  campaigns: "کمپین‌ها",
  subscribers: "خبرنامه",
  "abandoned-carts": "سبدهای رهاشده",
  coupons: "کدهای تخفیف",
  analytics: "تحلیل‌ها",
  sessions: "نشست‌ها",
  reports: "گزارش‌ها",
  settings: "تنظیمات",
  users: "مدیران",
  roles: "نقش‌ها",
  security: "امنیت",
  audit: "گزارش اقدامات",
  system: "سلامت سیستم",
  search: "جستجو",
};

interface ShellUser {
  name: string;
  phone: string;
  roleLabel: string;
}

interface Props {
  children: ReactNode;
  user: ShellUser;
  siteName: string;
  permissions: string[];
  nav: AdminNavSection[];
  notifications: AdminNotification[];
  badges: AdminBadges;
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (pathname === href) return true;
  if (exact) return false;
  return pathname.startsWith(`${href}/`);
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  const toggle = () => {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("ilkaii_theme", next ? "dark" : "light");
    setDark(next);
  };
  return (
    <button type="button" onClick={toggle} aria-label={dark ? "حالت روشن" : "حالت تاریک"} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink/65 hover:bg-line/60" title={dark ? "حالت روشن" : "حالت تاریک"}>
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

function Badge({ value }: { value: number }) {
  if (!value) return null;
  return <span className="ms-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-white">{formatNumber(Math.min(value, 99))}</span>;
}

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const items = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = PATH_LABELS[segment] ?? (index === segments.length - 1 ? "جزئیات" : segment);
    return { href, label };
  });
  return (
    <nav aria-label="مسیر صفحه" className="flex flex-wrap items-center gap-1.5 text-xs text-ink/50">
      {items.map((item, index) => (
        <span key={item.href} className="flex items-center gap-1.5">
          {index > 0 ? <ChevronLeft className="h-3 w-3" /> : null}
          {index === items.length - 1 ? <span aria-current="page" className="text-ink/75">{item.label}</span> : <Link href={item.href} className="hover:text-primary">{item.label}</Link>}
        </span>
      ))}
    </nav>
  );
}

export function AdminShell({ children, user, siteName, permissions, nav, notifications, badges }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState<"notifications" | "profile" | "quick" | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("ilkaii_admin_sidebar") === "collapsed");
  }, []);
  useEffect(() => {
    setMobileOpen(false);
    setMenu(null);
  }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    const outside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) setMenu(null);
    };
    window.addEventListener("keydown", close);
    window.addEventListener("mousedown", outside);
    return () => { window.removeEventListener("keydown", close); window.removeEventListener("mousedown", outside); };
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem("ilkaii_admin_sidebar", next ? "collapsed" : "open");
  };

  const quickActions = useMemo(() => [
    { href: "/admin/products", label: "محصول جدید", permission: "products.create", icon: Package },
    { href: "/admin/cms/pages", label: "صفحه جدید", permission: "cms.manage", icon: FileText },
    { href: "/admin/marketing/campaigns", label: "کمپین جدید", permission: "marketing.manage", icon: Megaphone },
    { href: "/admin/reports", label: "گزارش فروش", permission: "reports.view", icon: FileBarChart },
  ].filter((action) => permissions.includes(action.permission)), [permissions]);

  return (
    <div className="admin-shell flex min-h-screen">
      {mobileOpen ? <button type="button" aria-label="بستن منو" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

      <aside
        className={`admin-scroll fixed inset-y-0 right-0 z-50 flex flex-col border-l border-line bg-surface transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${collapsed ? "w-64 lg:w-20" : "w-64"} ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
        aria-label="منوی مدیریت"
      >
        <div className={`flex min-h-16 items-center gap-3 border-b border-line px-4 ${collapsed ? "justify-center" : ""}`}>
          <Link href="/admin/dashboard" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-bold text-white">{siteName.slice(0, 1)}</Link>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{siteName}</p>
              <p className="text-[10px] text-ink/45">مرکز کنترل</p>
            </div>
          ) : null}
          <button type="button" aria-label="بستن منو" onClick={() => setMobileOpen(false)} className="ms-auto inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-line/60 lg:hidden"><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {nav.map((section) => (
            <div key={section.title}>
              {!collapsed ? <h2 className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink/40">{section.title}</h2> : null}
              <div className="space-y-1">
                {section.links.map((link) => {
                  const Icon = ICONS[link.icon] ?? LayoutDashboard;
                  const active = isActive(pathname, link.href, link.exact);
                  const count = link.badge === "orders" ? badges.orders : link.badge === "returns" ? badges.returns : 0;
                  return (
                    <Link key={link.href} href={link.href} title={collapsed ? link.label : undefined} data-active={active} className={`admin-nav-link ${collapsed ? "justify-center px-2" : ""}`}>
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      {!collapsed ? <span className="truncate">{link.label}</span> : null}
                      {!collapsed ? <Badge value={count} /> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <button type="button" onClick={toggleCollapsed} className="hidden min-h-10 w-full items-center justify-center gap-2 rounded-xl text-xs text-ink/55 hover:bg-line/60 lg:flex" aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}>
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {!collapsed ? "جمع کردن منو" : null}
          </button>
          <Link href="/" className={`admin-nav-link mt-1 ${collapsed ? "justify-center px-2" : ""}`} title={collapsed ? "بازگشت به فروشگاه" : undefined}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            {!collapsed ? <span>فروشگاه</span> : null}
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header ref={headerRef} className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6">
            <button type="button" aria-label="باز کردن منو" onClick={() => setMobileOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-line/60 lg:hidden"><Menu className="h-5 w-5" /></button>

            <form action="/admin/search" method="get" role="search" className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
              <input name="q" placeholder="جستجوی محصول، سفارش، مشتری…" aria-label="جستجوی سراسری" className="field min-h-10 pe-9 ps-3 text-sm" />
            </form>

            <div className="ms-auto flex items-center gap-1">
              {quickActions.length ? (
                <div className="relative">
                  <button type="button" onClick={() => setMenu(menu === "quick" ? null : "quick")} aria-expanded={menu === "quick"} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm text-white hover:bg-hover">
                    <Plus className="h-4 w-4" /><span className="hidden sm:inline">اقدام سریع</span>
                  </button>
                  {menu === "quick" ? (
                    <div className="absolute left-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-soft">
                      {quickActions.map((action) => (
                        <Link key={action.href} href={action.href} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm hover:bg-line/60">
                          <action.icon className="h-4 w-4 text-primary" />{action.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <ThemeToggle />

              <div className="relative">
                <button type="button" onClick={() => setMenu(menu === "notifications" ? null : "notifications")} aria-expanded={menu === "notifications"} aria-label={`اعلان‌ها (${notifications.length})`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink/65 hover:bg-line/60">
                  <Bell className="h-5 w-5" />
                  {notifications.length ? <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" /> : null}
                </button>
                {menu === "notifications" ? (
                  <div className="absolute left-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <p className="text-sm font-semibold">اعلان‌ها</p>
                      <span className="admin-chip">{formatNumber(notifications.length)} مورد</span>
                    </div>
                    <div className="admin-scroll max-h-96 overflow-y-auto p-2">
                      {notifications.map((item) => (
                        <Link key={item.id} href={item.href ?? "#"} className="flex gap-3 rounded-xl p-3 hover:bg-line/50">
                          <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.tone === "danger" ? "bg-red-500" : item.tone === "warning" ? "bg-amber-500" : item.tone === "success" ? "bg-emerald-500" : "bg-primary"}`} />
                          <span className="min-w-0">
                            <span className="block text-xs font-medium">{item.title}</span>
                            {item.description ? <span className="mt-0.5 block truncate text-[11px] text-ink/55">{item.description}</span> : null}
                          </span>
                        </Link>
                      ))}
                      {!notifications.length ? <p className="p-6 text-center text-sm text-ink/50">اعلان جدیدی وجود ندارد.</p> : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button type="button" onClick={() => setMenu(menu === "profile" ? null : "profile")} aria-expanded={menu === "profile"} className="flex min-h-10 items-center gap-2 rounded-xl px-2 hover:bg-line/60">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{user.name.slice(0, 1)}</span>
                  <span className="hidden text-right sm:block">
                    <span className="block max-w-32 truncate text-xs font-medium">{user.name}</span>
                    <span className="block text-[10px] text-ink/50">{user.roleLabel}</span>
                  </span>
                  <ChevronDown className="hidden h-3 w-3 text-ink/40 sm:block" />
                </button>
                {menu === "profile" ? (
                  <div className="absolute left-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-soft">
                    <div className="border-b border-line px-3 py-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p dir="ltr" className="mt-0.5 text-xs text-ink/50">{user.phone}</p>
                      <p className="mt-1 text-[11px] text-primary">{user.roleLabel}</p>
                    </div>
                    <Link href="/account" className="mt-1 flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm hover:bg-line/60"><Users className="h-4 w-4" />حساب کاربری</Link>
                    <Link href="/admin/settings" className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm hover:bg-line/60"><Settings className="h-4 w-4" />تنظیمات</Link>
                    <button type="button" className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-red-600 hover:bg-red-50" onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
                      router.push("/");
                      router.refresh();
                    }}><LogOut className="h-4 w-4" />خروج</button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line/60 px-4 py-2 sm:px-6">
            <Breadcrumbs />
            <span className="ms-auto hidden text-[10px] text-ink/35 sm:inline">ILKAII Control Center</span>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        <footer className="border-t border-line px-6 py-4 text-center text-[10px] text-ink/35">مرکز کنترل {siteName} — دسترسی‌ها در سرور اعتبارسنجی می‌شوند.</footer>
      </div>
    </div>
  );
}
