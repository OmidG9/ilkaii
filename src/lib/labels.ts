import type {
  CampaignChannel,
  CampaignStatus,
  CmsStatus,
  InventoryReason,
  MenuLocation,
  NotificationChannel,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  ReturnStatus,
  ShippingMethod,
  SubscriberStatus,
} from "@prisma/client";
import { BUILT_IN_ROLES, roleLabel } from "@/lib/permissions";

export const shippingMethodLabels: Record<ShippingMethod, string> = {
  POSTAL: "پست پیشتاز",
  COURIER: "پیک",
  PICKUP: "تحویل حضوری",
  FLAT: "نرخ ثابت",
  ALOPEYK: "الو پیک",
  PISHTAZ: "پست پیشتاز",
  TIPAX: "تیپاکس",
};

export const paymentGatewayLabels: Record<string, string> = {
  ZARINPAL: "زرین‌پال",
  ZIBAL: "زیبال",
  BEHPARDAKHT: "به‌پرداخت ملت",
  MOCK: "پرداخت آزمایشی",
  COD: "پرداخت در محل",
  FREE: "سفارش رایگان",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  PROCESSING: "در حال آماده‌سازی",
  PACKED: "بسته‌بندی شده",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازپرداخت شده",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "در انتظار",
  PAID: "پرداخت شده",
  FAILED: "ناموفق",
  REFUNDED: "بازپرداخت شده",
};

export const returnStatusLabels: Record<ReturnStatus, string> = {
  PENDING: "در انتظار بررسی",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  COMPLETED: "تکمیل شده",
};

export const inventoryReasonLabels: Record<InventoryReason, string> = {
  SALE: "فروش",
  RESTOCK: "شارژ موجودی",
  ADJUSTMENT: "تنظیم دستی",
  RETURN: "بازگشت",
  CANCELLATION: "لغو سفارش",
};

export const roleLabels: Record<string, string> = Object.fromEntries(
  BUILT_IN_ROLES.map((code) => [code, roleLabel(code)]),
);

export const cmsStatusLabels: Record<CmsStatus, string> = {
  DRAFT: "پیش‌نویس",
  SCHEDULED: "زمان‌بندی شده",
  PUBLISHED: "منتشر شده",
  ARCHIVED: "بایگانی",
};

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  DRAFT: "پیش‌نویس",
  SCHEDULED: "زمان‌بندی شده",
  ACTIVE: "فعال",
  PAUSED: "متوقف",
  COMPLETED: "تکمیل شده",
  CANCELLED: "لغو شده",
};

export const campaignChannelLabels: Record<CampaignChannel, string> = {
  EMAIL: "ایمیل",
  SMS: "پیامک",
  BANNER: "بنر",
};

export const subscriberStatusLabels: Record<SubscriberStatus, string> = {
  PENDING: "در انتظار تأیید",
  ACTIVE: "فعال",
  UNSUBSCRIBED: "لغو عضویت",
  BOUNCED: "برگشتی",
};

export const notificationStatusLabels: Record<NotificationStatus, string> = {
  QUEUED: "در صف",
  SENT: "ارسال شده",
  FAILED: "ناموفق",
  SKIPPED: "رد شده",
};

export const notificationChannelLabels: Record<NotificationChannel, string> = {
  EMAIL: "ایمیل",
  SMS: "پیامک",
};

export const menuLocationLabels: Record<MenuLocation, string> = {
  HEADER: "منوی اصلی",
  FOOTER: "منوی پایین",
  MOBILE: "منوی موبایل",
};

export const analyticsEventLabels: Record<string, string> = {
  page_view: "بازدید صفحه",
  product_view: "مشاهده محصول",
  category_view: "مشاهده دسته‌بندی",
  search: "جستجو",
  filter_applied: "اعمال فیلتر",
  variant_selected: "انتخاب تنوع",
  add_to_cart: "افزودن به سبد",
  remove_from_cart: "حذف از سبد",
  wishlist_add: "افزودن به علاقه‌مندی",
  begin_checkout: "شروع تسویه",
  add_shipping_info: "ثبت اطلاعات ارسال",
  payment_initiated: "شروع پرداخت",
  purchase: "خرید",
  refund: "بازپرداخت",
  review_submitted: "ثبت نظر",
};

export const homepageSectionLabels: Record<string, string> = {
  HERO: "هیرو",
  BANNER: "بنر",
  FEATURED_CATEGORIES: "دسته‌بندی‌های ویژه",
  FEATURED_PRODUCTS: "محصولات ویژه",
  NEW_ARRIVALS: "جدیدترین‌ها",
  BEST_SELLERS: "پرفروش‌ها",
  PROMOTIONAL: "بخش تبلیغاتی",
  SEASONAL_COLLECTION: "کلکسیون فصلی",
  TESTIMONIALS: "نظرات مشتریان",
  CUSTOM_CONTENT: "بلوک محتوای دلخواه",
};
