import type { PermissionKey } from "@/lib/permissions";

export interface AdminNavLink {
  href: string;
  label: string;
  /** A link is shown when the role has at least one of these permissions. */
  permission: PermissionKey | PermissionKey[];
  icon: string;
  exact?: boolean;
  badge?: "orders" | "returns";
}

export interface AdminNavSection {
  title: string;
  links: AdminNavLink[];
}

export const ADMIN_NAV: AdminNavSection[] = [
  {
    title: "مرور کلی",
    links: [
      { href: "/admin/dashboard", label: "داشبورد", permission: "dashboard.view", icon: "LayoutDashboard" },
      { href: "/admin/reports", label: "گزارش‌ها", permission: "reports.view", icon: "FileBarChart" },
    ],
  },
  {
    title: "فروش",
    links: [
      { href: "/admin/orders", label: "سفارش‌ها", permission: "orders.view", icon: "ShoppingBag", badge: "orders" },
      { href: "/admin/returns", label: "مرجوعی‌ها", permission: "orders.view", icon: "RotateCcw", badge: "returns" },
      { href: "/admin/customers", label: "مشتریان", permission: "customers.view", icon: "Users" },
    ],
  },
  {
    title: "کاتالوگ",
    links: [
      { href: "/admin/products", label: "محصولات", permission: "products.view", icon: "Package" },
      { href: "/admin/categories", label: "دسته‌بندی‌ها", permission: "products.view", icon: "FolderTree" },
      { href: "/admin/brands", label: "برندها", permission: "products.view", icon: "Tag" },
      { href: "/admin/reviews", label: "نظرات", permission: "products.view", icon: "MessageSquare" },
    ],
  },
  {
    title: "انبار و موجودی",
    links: [
      { href: "/admin/inventory", label: "مدیریت موجودی", permission: "inventory.manage", icon: "Boxes", exact: true },
      { href: "/admin/inventory/suppliers", label: "تأمین‌کنندگان", permission: "inventory.manage", icon: "Truck" },
      { href: "/admin/inventory/purchase-orders", label: "سفارش‌های خرید", permission: "inventory.manage", icon: "ClipboardList" },
      { href: "/admin/inventory/stocktakes", label: "انبارگردانی", permission: "inventory.manage", icon: "ClipboardCheck" },
      { href: "/admin/inventory/movements", label: "تاریخچه موجودی", permission: "inventory.manage", icon: "History" },
    ],
  },
  {
    title: "محتوا",
    links: [
      { href: "/admin/cms", label: "مدیریت محتوا", permission: "cms.manage", icon: "PanelsTopLeft", exact: true },
      { href: "/admin/cms/pages", label: "صفحات", permission: "cms.manage", icon: "FileText" },
      { href: "/admin/cms/homepage", label: "صفحه اصلی", permission: "cms.manage", icon: "LayoutTemplate" },
      { href: "/admin/cms/banners", label: "بنرها", permission: "cms.manage", icon: "Image" },
      { href: "/admin/cms/menus", label: "منوها", permission: "cms.manage", icon: "Navigation" },
      { href: "/admin/cms/media", label: "رسانه", permission: "cms.manage", icon: "Images" },
      { href: "/admin/cms/blog", label: "وبلاگ", permission: "cms.manage", icon: "Newspaper" },
      { href: "/admin/cms/footer", label: "پایین صفحه", permission: "cms.manage", icon: "PanelBottom" },
    ],
  },
  {
    title: "بازاریابی",
    links: [
      { href: "/admin/marketing", label: "مرکز بازاریابی", permission: "marketing.manage", icon: "Megaphone", exact: true },
      { href: "/admin/marketing/campaigns", label: "کمپین‌ها", permission: "marketing.manage", icon: "Send" },
      { href: "/admin/marketing/subscribers", label: "خبرنامه", permission: "marketing.manage", icon: "Mail" },
      { href: "/admin/marketing/abandoned-carts", label: "سبدهای رهاشده", permission: "marketing.manage", icon: "ShoppingCart" },
      { href: "/admin/coupons", label: "کدهای تخفیف", permission: ["marketing.manage", "coupon.write"], icon: "TicketPercent" },
    ],
  },
  {
    title: "تحلیل رفتار",
    links: [
      { href: "/admin/analytics", label: "تحلیل‌ها", permission: "analytics.view", icon: "BarChart3", exact: true },
      { href: "/admin/analytics/sessions", label: "نشست‌ها", permission: "analytics.view", icon: "Activity" },
    ],
  },
  {
    title: "سیستم",
    links: [
      { href: "/admin/settings", label: "تنظیمات", permission: "settings.manage", icon: "Settings" },
      { href: "/admin/users", label: "مدیران", permission: "users.manage", icon: "UserCog" },
      { href: "/admin/roles", label: "نقش‌ها و دسترسی", permission: "users.manage", icon: "ShieldCheck" },
      { href: "/admin/security", label: "امنیت و نشست‌ها", permission: "users.manage", icon: "KeyRound" },
      { href: "/admin/audit", label: "گزارش اقدامات", permission: ["audit.view", "audit.read"], icon: "ScrollText" },
      { href: "/admin/system", label: "سلامت سیستم", permission: "system.view", icon: "HeartPulse" },
    ],
  },
];

export function visibleNav(permissions: readonly string[]): AdminNavSection[] {
  return ADMIN_NAV
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => {
        const required = Array.isArray(link.permission) ? link.permission : [link.permission];
        return required.some((permission) => permissions.includes(permission));
      }),
    }))
    .filter((section) => section.links.length > 0);
}

export interface AdminNotification {
  id: string;
  title: string;
  description?: string;
  href?: string;
  tone: "info" | "warning" | "danger" | "success";
  createdAt?: string;
}
