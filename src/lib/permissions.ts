/**
 * RBAC catalogue and default grants.
 *
 * Role codes are plain strings so custom roles can be created at runtime. The
 * built-in roles below are seeded idempotently; their permission rows live in
 * the database and are editable by a SUPER_ADMIN.
 *
 * Legacy permission keys (product.read/write, order.read/write, …) are kept as
 * aliases because existing route handlers were written against them. New code
 * must use the namespaced keys from the specification.
 */

export const PERMISSIONS = [
  // Namespaced (Control Center specification)
  "dashboard.view",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "inventory.manage",
  "orders.view",
  "orders.update",
  "orders.export",
  "customers.view",
  "customers.update",
  "customers.export",
  "cms.manage",
  "analytics.view",
  "analytics.export",
  "marketing.manage",
  "reports.view",
  "settings.manage",
  "users.manage",
  "audit.view",
  "system.view",
  // Legacy aliases used by the existing API surface
  "product.read",
  "product.write",
  "inventory.write",
  "order.read",
  "order.write",
  "customer.read",
  "customer.write",
  "coupon.write",
  "setting.write",
  "audit.read",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export const BUILT_IN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRODUCT_MANAGER",
  "ORDER_MANAGER",
  "CONTENT_MANAGER",
  "MARKETING_MANAGER",
  "ANALYST",
  "SUPPORT_AGENT",
  "CUSTOMER",
] as const;

export type BuiltInRoleCode = (typeof BUILT_IN_ROLES)[number];
export type RoleCode = string;

export const ROLE_NAMES: Record<BuiltInRoleCode, string> = {
  SUPER_ADMIN: "مدیرکل",
  ADMIN: "مدیر",
  PRODUCT_MANAGER: "مدیر محصولات",
  ORDER_MANAGER: "مدیر سفارش‌ها",
  CONTENT_MANAGER: "مدیر محتوا",
  MARKETING_MANAGER: "مدیر بازاریابی",
  ANALYST: "تحلیل‌گر",
  SUPPORT_AGENT: "پشتیبان مشتری",
  CUSTOMER: "مشتری",
};

export const ROLE_DESCRIPTIONS: Record<BuiltInRoleCode, string> = {
  SUPER_ADMIN: "دسترسی کامل به همه بخش‌ها و تنظیمات امنیتی",
  ADMIN: "مدیریت فروشگاه بدون دسترسی به رازهای یکپارچه‌سازی و نقش‌ها",
  PRODUCT_MANAGER: "محصولات، تنوع‌ها، موجودی و دسته‌بندی‌ها",
  ORDER_MANAGER: "سفارش‌ها، ارسال، مرجوعی و مشاهده مشتریان",
  CONTENT_MANAGER: "صفحات، صفحه اصلی، بنرها، منوها، رسانه و وبلاگ",
  MARKETING_MANAGER: "کمپین‌ها، کدهای تخفیف، سبد رهاشده و مشترکان",
  ANALYST: "تحلیل رفتار مشتری و گزارش‌ها، بدون امکان تغییر داده",
  SUPPORT_AGENT: "پاسخ‌گویی به مشتریان، سفارش‌ها و مرجوعی‌ها",
  CUSTOMER: "فقط فروشگاه",
};

const ALL = PERMISSIONS;
const PRODUCT_TEAM = [
  "dashboard.view", "products.view", "products.create", "products.update", "products.delete",
  "inventory.manage", "product.read", "product.write", "inventory.write",
] as const;
const ORDER_TEAM = [
  "dashboard.view", "orders.view", "orders.update", "orders.export", "customers.view",
  "order.read", "order.write", "customer.read",
] as const;

/** Default permission grants for the built-in roles. */
export const DEFAULT_GRANTS: Record<BuiltInRoleCode, readonly PermissionKey[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL.filter((key) => !["settings.manage", "setting.write", "users.manage"].includes(key)),
  PRODUCT_MANAGER: PRODUCT_TEAM,
  ORDER_MANAGER: ORDER_TEAM,
  CONTENT_MANAGER: ["dashboard.view", "cms.manage", "products.view", "product.read"],
  MARKETING_MANAGER: [
    "dashboard.view", "marketing.manage", "analytics.view", "analytics.export",
    "reports.view", "customers.view", "customers.export", "coupon.write",
  ],
  ANALYST: [
    "dashboard.view", "analytics.view", "analytics.export", "reports.view",
    "customers.view", "audit.view", "audit.read",
  ],
  SUPPORT_AGENT: [
    "dashboard.view", "orders.view", "customers.view", "customers.update",
    "order.read", "customer.read", "customer.write",
  ],
  CUSTOMER: [],
};

export function isBuiltInRole(code: string): code is BuiltInRoleCode {
  return (BUILT_IN_ROLES as readonly string[]).includes(code);
}

export function roleLabel(code: string): string {
  return isBuiltInRole(code) ? ROLE_NAMES[code] : code;
}

export function roleHasPermission(role: string, permission: PermissionKey): boolean {
  if (isBuiltInRole(role)) return DEFAULT_GRANTS[role].includes(permission);
  return false;
}

export function roleCanAccessAdmin(role: string): boolean {
  return role !== "CUSTOMER";
}

export function permissionsForRole(role: string): readonly PermissionKey[] {
  return isBuiltInRole(role) ? DEFAULT_GRANTS[role] : [];
}

/** Legacy keys are managed automatically when the namespaced key is granted. */
export const LEGACY_ALIASES: Partial<Record<PermissionKey, PermissionKey>> = {
  "products.view": "product.read",
  "products.create": "product.write",
  "products.update": "product.write",
  "products.delete": "product.write",
  "inventory.manage": "inventory.write",
  "orders.view": "order.read",
  "orders.update": "order.write",
  "customers.view": "customer.read",
  "customers.update": "customer.write",
  "marketing.manage": "coupon.write",
  "settings.manage": "setting.write",
  "audit.view": "audit.read",
};

export function expandPermissionKeys(keys: readonly PermissionKey[]): PermissionKey[] {
  const result = new Set<PermissionKey>(keys);
  for (const key of keys) {
    const alias = LEGACY_ALIASES[key];
    if (alias) result.add(alias);
  }
  return [...result];
}

export const LEGACY_PERMISSION_KEYS = new Set<PermissionKey>([
  "product.read", "product.write", "inventory.write", "order.read", "order.write",
  "customer.read", "customer.write", "coupon.write", "setting.write", "audit.read",
]);

export const EDITOR_PERMISSIONS = PERMISSIONS.filter((key) => !LEGACY_PERMISSION_KEYS.has(key));

export const PERMISSION_GROUPS: Record<string, string> = {
  dashboard: "داشبورد",
  products: "محصولات",
  inventory: "موجودی",
  orders: "سفارش‌ها",
  customers: "مشتریان",
  cms: "محتوا",
  analytics: "تحلیل",
  marketing: "بازاریابی",
  reports: "گزارش‌ها",
  settings: "تنظیمات",
  users: "کاربران و نقش‌ها",
  audit: "گزارش اقدامات",
  system: "سیستم",
};

export const PERMISSION_LABELS: Record<string, string> = {
  "dashboard.view": "مشاهده داشبورد",
  "products.view": "مشاهده محصولات",
  "products.create": "ایجاد محصول",
  "products.update": "ویرایش محصول",
  "products.delete": "بایگانی محصول",
  "inventory.manage": "مدیریت موجودی",
  "orders.view": "مشاهده سفارش‌ها",
  "orders.update": "تغییر وضعیت سفارش",
  "orders.export": "خروجی سفارش‌ها",
  "customers.view": "مشاهده مشتریان",
  "customers.update": "ویرایش مشتریان",
  "customers.export": "خروجی مشتریان",
  "cms.manage": "مدیریت محتوا و صفحه اصلی",
  "analytics.view": "مشاهده تحلیل رفتار",
  "analytics.export": "خروجی تحلیل‌ها",
  "marketing.manage": "مدیریت بازاریابی",
  "reports.view": "مشاهده گزارش‌ها",
  "settings.manage": "مدیریت تنظیمات و رازها",
  "users.manage": "مدیریت مدیران و نقش‌ها",
  "audit.view": "مشاهده گزارش اقدامات",
  "system.view": "مشاهده سلامت سیستم",
  "product.read": "مشاهده محصولات (قدیمی)",
  "product.write": "ویرایش محصولات (قدیمی)",
  "inventory.write": "نوشتن موجودی (قدیمی)",
  "order.read": "مشاهده سفارش (قدیمی)",
  "order.write": "ویرایش سفارش (قدیمی)",
  "customer.read": "مشاهده مشتری (قدیمی)",
  "customer.write": "ویرایش مشتری (قدیمی)",
  "coupon.write": "کد تخفیف (قدیمی)",
  "setting.write": "تنظیمات (قدیمی)",
  "audit.read": "گزارش اقدامات (قدیمی)",
};
