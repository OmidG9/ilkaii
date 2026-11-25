import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { permissionKeysForRole, requirePageAnyPermission } from "@/lib/auth/session";
import { CUSTOMER_SEGMENTS, getCustomerProfile } from "@/services/crm";
import { AdminDataTable, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { CustomerNotes } from "@/components/admin/customer-notes";
import { Badge } from "@/components/ui/display";
import { formatJalali, formatNumber } from "@/lib/persian";
import { formatToman } from "@/lib/money";
import { orderStatusLabels, paymentStatusLabels, returnStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "پروفایل مشتری" };
export const dynamic = "force-dynamic";

const segmentLabels = Object.fromEntries(CUSTOMER_SEGMENTS.map((item) => [item.key, item.label])) as Record<string, string>;

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageAnyPermission("customers.view", "customer.read");
  const permissions = await permissionKeysForRole(user.role);
  const { id } = await params;
  let customer;
  try {
    customer = await getCustomerProfile(id);
  } catch {
    notFound();
  }
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "بدون نام";

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={name}
        description={`${customer.phone} — عضویت ${formatJalali(customer.createdAt)} — ${customer.roleLabel}`}
        actions={
          <>
            <Link href="/admin/customers" className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary">بازگشت</Link>
            <Link href={`/admin/orders?q=${encodeURIComponent(customer.phone)}`} className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary">سفارش‌ها</Link>
            {permissions.includes("customers.export") ? <Link href={`/api/admin/customers/export?q=${encodeURIComponent(customer.phone)}`} prefetch={false} className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary">خروجی CSV</Link> : null}
          </>
        }
        badge={<Badge tone={customer.isActive ? "success" : "danger"}>{customer.isActive ? "فعال" : "غیرفعال"}</Badge>}
      />

      <div className="flex flex-wrap gap-1.5">
        {customer.segments.length ? customer.segments.map((segment) => <span key={segment} className="admin-chip">{segmentLabels[segment]}</span>) : <span className="admin-chip">بدون بخش</span>}
        {customer.marketingOptIn ? <span className="admin-chip">رضایت بازاریابی</span> : null}
        {customer.isVerified ? <span className="admin-chip">موبایل تأییدشده</span> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="مجموع خرید" value={formatToman(customer.spent)} />
        <AdminStatCard label="سفارش پرداخت‌شده" value={formatNumber(customer.paidOrders)} hint={`کل سفارش‌ها: ${formatNumber(customer.totalOrders)}`} />
        <AdminStatCard label="میانگین ارزش سفارش" value={customer.averageOrderValue === null ? "—" : formatToman(customer.averageOrderValue)} />
        <AdminStatCard label="آخرین خرید" value={customer.lastPurchase ? formatJalali(customer.lastPurchase) : "—"} hint={`لغو شده: ${formatNumber(customer.cancelledOrders)}`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="admin-panel p-5">
            <h2 className="mb-3 text-sm font-semibold">اطلاعات تماس و حساب</h2>
            <dl className="grid gap-3 text-xs sm:grid-cols-2">
              <div><dt className="text-ink/40">موبایل</dt><dd dir="ltr" className="mt-1">{customer.phone}</dd></div>
              <div><dt className="text-ink/40">ایمیل</dt><dd dir="ltr" className="mt-1">{customer.email ?? "—"}</dd></div>
              <div><dt className="text-ink/40">آخرین ورود</dt><dd className="mt-1">{customer.lastLogin ? formatJalali(customer.lastLogin, true) : "—"}</dd></div>
              <div><dt className="text-ink/40">آخرین فعالیت</dt><dd className="mt-1">{customer.lastActivityAt ? formatJalali(customer.lastActivityAt, true) : "—"}</dd></div>
            </dl>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">تاریخچه سفارش‌ها</h2>
            <AdminDataTable
              rows={customer.orders}
              rowKey={(order) => order.id}
              emptyText="سفارشی ثبت نشده است."
              columns={[
                { key: "orderNumber", header: "سفارش", ltr: true, render: (order) => <Link href={`/admin/orders/${order.id}`} className="text-[11px] font-medium text-primary hover:underline">{order.orderNumber}</Link> },
                { key: "createdAt", header: "تاریخ", render: (order) => <span className="text-[10px]">{formatJalali(order.createdAt)}</span> },
                { key: "items", header: "اقلام", render: (order) => formatNumber(order._count.items) },
                { key: "total", header: "مبلغ", ltr: true, render: (order) => formatToman(order.total) },
                { key: "status", header: "وضعیت", render: (order) => <span className="text-[10px]">{orderStatusLabels[order.status]}</span> },
                { key: "payment", header: "پرداخت", render: (order) => <span className="text-[10px]">{paymentStatusLabels[order.paymentStatus]}</span> },
              ]}
            />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">مرجوعی‌ها</h2>
            <AdminDataTable
              rows={customer.returnRequests}
              rowKey={(request) => request.id}
              emptyText="درخواست مرجوعی ثبت نشده است."
              columns={[
                { key: "createdAt", header: "تاریخ", render: (request) => <span className="text-[10px]">{formatJalali(request.createdAt)}</span> },
                { key: "reason", header: "دلیل", render: (request) => <span className="block max-w-96 truncate text-[11px]">{request.reason}</span> },
                { key: "status", header: "وضعیت", render: (request) => <span className="text-[10px]">{returnStatusLabels[request.status]}</span> },
                { key: "note", header: "یادداشت", render: (request) => <span className="block max-w-48 truncate text-[10px] text-ink/50">{request.note ?? "—"}</span> },
              ]}
            />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold">آدرس‌ها</h2>
            <AdminDataTable
              rows={customer.addresses}
              rowKey={(address) => address.id}
              emptyText="آدرسی ثبت نشده است."
              columns={[
                { key: "label", header: "برچسب" },
                { key: "fullName", header: "گیرنده" },
                { key: "province", header: "استان" },
                { key: "city", header: "شهر" },
                { key: "postalCode", header: "کد پستی", ltr: true },
              ]}
            />
          </section>
        </div>

        <aside className="space-y-5">
          {permissions.includes("customers.update") ? (
            <section className="admin-panel p-5">
              <h2 className="mb-3 text-sm font-semibold">یادداشت و رضایت</h2>
              <CustomerNotes customerId={customer.id} initialNote={customer.adminNote ?? ""} initialOptIn={customer.marketingOptIn} />
            </section>
          ) : null}

          <section className="admin-panel p-5">
            <h2 className="mb-3 text-sm font-semibold">علاقه‌مندی‌ها ({customer.wishlistItems.length})</h2>
            <ul className="space-y-2 text-xs">
              {customer.wishlistItems.map((item) => (
                <li key={item.product.id} className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
                  <Link href={`/product/${item.product.slug}`} className="truncate hover:text-primary">{item.product.name}</Link>
                  <span className="shrink-0 text-[10px] text-ink/45">{formatToman(item.product.price)}</span>
                </li>
              ))}
              {!customer.wishlistItems.length ? <li className="text-ink/40">موردی نیست.</li> : null}
            </ul>
          </section>

          <section className="admin-panel p-5">
            <h2 className="mb-3 text-sm font-semibold">محصولات مشاهده‌شده</h2>
            {customer.viewedProducts.length ? (
              <ul className="space-y-2 text-xs">
                {customer.viewedProducts.map((row, index) => (
                  <li key={`${row.product?.id ?? "unknown"}-${index}`} className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
                    <span className="truncate">{row.product?.name ?? "محصول حذف‌شده"}</span>
                    <span className="shrink-0 text-[9px] text-ink/40">{formatJalali(row.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[11px] text-ink/40">داده مشاهده محصول برای این مشتری ثبت نشده است.</p>}
          </section>

          <section className="admin-panel p-5">
            <h2 className="mb-3 text-sm font-semibold">سبد خرید فعلی</h2>
            {customer.cart?.items.length ? (
              <ul className="space-y-2 text-xs">
                {customer.cart.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 border-b border-line/60 pb-2">
                    <span className="truncate">{item.product.name}{item.variant ? ` / ${[item.variant.size, item.variant.color].filter(Boolean).join(" ")}` : ""}</span>
                    <span className="shrink-0 text-[10px]">×{formatNumber(item.quantity)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-[11px] text-ink/40">سبد خرید خالی است.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
