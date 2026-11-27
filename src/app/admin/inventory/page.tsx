import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { AdminChart, AdminPageHeader, AdminStatCard } from "@/components/admin/admin-widgets";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { InventoryStockTable, type InventoryRowView } from "@/components/admin/inventory-stock-table";
import { Card, Pagination, SectionTitle } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { formatToman } from "@/lib/money";
import { formatJalali, formatNumber } from "@/lib/persian";
import { inventoryReasonLabels } from "@/lib/labels";
import {
  getDeadStock,
  getInventoryFilterOptions,
  getInventoryOverview,
  getReorderSuggestions,
  listInventoryVariants,
  listMovements,
  type InventoryStockFilter,
} from "@/services/warehouse";
import { CircleDollarSign, ClipboardCheck, ClipboardList, PackageMinus, PackageX, TrendingUp, Warehouse } from "lucide-react";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "انبار و موجودی — مدیریت" };
export const dynamic = "force-dynamic";

function stockFilter(value: string | undefined): InventoryStockFilter {
  return value === "out" || value === "low" || value === "ok" ? value : "all";
}

function sortFilter(value: string | undefined) {
  return value === "product" || value === "stock-desc" || value === "value-desc" || value === "updated" ? value : "stock-asc";
}

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("inventory.manage");
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const category = typeof params.category === "string" ? params.category.slice(0, 64) : "";
  const stock = stockFilter(typeof params.stock === "string" ? params.stock : undefined);
  const sort = sortFilter(typeof params.sort === "string" ? params.sort : undefined);

  const [overview, inventory, suggestions, deadStock, options, recentMovements] = await Promise.all([
    getInventoryOverview(),
    listInventoryVariants({ page, pageSize: 15, q: q || undefined, categoryId: category || undefined, stock, sort }),
    getReorderSuggestions(8),
    getDeadStock(6),
    getInventoryFilterOptions(),
    listMovements({ page: 1, pageSize: 6 }),
  ]);

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (category) exportParams.set("category", category);
  if (stock !== "all") exportParams.set("stock", stock);

  const rows = inventory.items as InventoryRowView[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="مدیریت انبار و موجودی"
        description="موجودی در سطح تنوع (سایز/رنگ) کنترل می‌شود؛ هر تغییر با دلیل، کاربر و مانده پس از تغییر در دفتر انبار ثبت می‌شود."
        actions={
          <>
            <ButtonLink href="/admin/inventory/purchase-orders/new" size="sm">سفارش خرید</ButtonLink>
            <ButtonLink href="/admin/inventory/stocktakes/new" variant="outline" size="sm">انبارگردانی</ButtonLink>
            <a href={`/api/admin/inventory/export?${exportParams.toString()}`} className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-xs hover:border-primary">خروجی CSV</a>
          </>
        }
      />
      <WarehouseTabs />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="واحدهای موجود" value={formatNumber(overview.units)} hint={`${formatNumber(overview.skus)} تنوع کالا`} icon={<Warehouse className="h-5 w-5" />} definition="مجموع موجودی همه تنوع‌ها در همه محصولات حذف‌نشده." />
        <AdminStatCard label="ارزش موجودی (بهای خرید)" value={formatToman(overview.costValue)} hint="بر پایه بهای خرید ثبت‌شده" icon={<CircleDollarSign className="h-5 w-5" />} definition="جمع موجودی × بهای خرید هر تنوع. برای تنوع‌های بدون بهای خرید، صفر محاسبه می‌شود." />
        <AdminStatCard label="ارزش فروش موجودی" value={formatToman(overview.retailValue)} hint={`حاشیه بالقوه: ${formatToman(overview.potentialMargin)}`} icon={<TrendingUp className="h-5 w-5" />} definition="جمع موجودی × قیمت فروش مؤثر (قیمت تنوع، سپس قیمت تخفیف محصول، سپس قیمت پایه)." />
        <AdminStatCard label="موجودی کم" value={formatNumber(overview.lowStock)} hint={`ناموجود: ${formatNumber(overview.outOfStock)}`} tone={overview.lowStock || overview.outOfStock ? "danger" : "success"} icon={<PackageMinus className="h-5 w-5" />} href="/admin/inventory?stock=low" definition="تنوع‌هایی که موجودی مثبت و کمتر یا مساوی آستانه هشدار خود دارند." />
        <AdminStatCard label="کالای راکد" value={formatNumber(overview.deadStock)} hint="بدون فروش در ۹۰ روز گذشته" tone={overview.deadStock ? "warning" : "success"} icon={<PackageX className="h-5 w-5" />} definition="تنوع‌های دارای موجودی که در ۹۰ روز گذشته هیچ فروشی نداشته‌اند؛ سرمایه خواب‌رفته." />
        <AdminStatCard label="سفارش‌های خرید باز" value={formatNumber(overview.openPurchaseOrders)} hint="ثبت‌شده یا ورود بخشی" icon={<ClipboardList className="h-5 w-5" />} href="/admin/inventory/purchase-orders?status=ORDERED" />
        <AdminStatCard label="انبارگردانی‌های باز" value={formatNumber(overview.pendingStocktakes)} hint="در انتظار شمارش/تکمیل" icon={<ClipboardCheck className="h-5 w-5" />} href="/admin/inventory/stocktakes" />
        <AdminStatCard label="تنوع غیرفعال" value={formatNumber(overview.unavailable)} hint="قابل فروش نیستند" definition="تنوع‌هایی که پرچم «قابل فروش» آن‌ها خاموش است." />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminChart
          title="گردش موجودی ۱۴ روز اخیر"
          subtitle="واحدهای ورودی و خروجی ثبت‌شده در دفتر انبار"
          data={overview.movementTrend.map((row) => ({ label: row.day.slice(5), value: row.incoming, secondary: row.outgoing }))}
          type="bar"
          valueLabel="واحد"
          secondaryLabel="خروجی"
          emptyText="در دو هفته اخیر گردشی ثبت نشده است."
        />
        <AdminChart
          title="ارزش موجودی بر اساس دسته‌بندی"
          subtitle="بر پایه بهای خرید ثبت‌شده"
          data={overview.valueByCategory.map((row) => ({ label: row.label, value: row.value }))}
          type="donut"
          valueLabel="تومان"
          formatValue={(value) => formatToman(value)}
          emptyText="برای نمایش ارزش، بهای خرید تنوع‌ها را تکمیل کنید."
        />
      </div>

      <section>
        <SectionTitle title="کالاها و موجودی" subtitle="جستجو بر اساس نام، SKU، بارکد یا قفسه؛ تنظیم مستقیم موجودی و مشخصات انبار." />
        <Card className="mb-5 p-4">
          <form method="get" className="grid items-end gap-3 md:grid-cols-[1fr_180px_160px_170px_auto]">
            <label className="space-y-1.5">
              <span className="block text-xs text-ink/55">جستجو</span>
              <input name="q" defaultValue={q} placeholder="نام محصول، SKU، بارکد، قفسه…" className="field min-h-11 w-full" />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs text-ink/55">دسته‌بندی</span>
              <select name="category" defaultValue={category} className="field min-h-11 w-full cursor-pointer">
                <option value="">همه</option>
                {options.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs text-ink/55">وضعیت موجودی</span>
              <select name="stock" defaultValue={stock} className="field min-h-11 w-full cursor-pointer">
                <option value="all">همه</option>
                <option value="out">ناموجود</option>
                <option value="low">کم</option>
                <option value="ok">مناسب</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs text-ink/55">مرتب‌سازی</span>
              <select name="sort" defaultValue={sort} className="field min-h-11 w-full cursor-pointer">
                <option value="stock-asc">کمترین موجودی</option>
                <option value="stock-desc">بیشترین موجودی</option>
                <option value="value-desc">بیشترین ارزش</option>
                <option value="product">نام محصول</option>
                <option value="updated">آخرین تغییر</option>
              </select>
            </label>
            <button type="submit" className="min-h-11 rounded-xl bg-primary px-5 text-sm text-white">اعمال</button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <InventoryStockTable rows={rows} suppliers={options.suppliers} />
        </Card>
        <Pagination page={page} pageCount={inventory.pageCount} pathname="/admin/inventory" params={{ q: q || undefined, category: category || undefined, stock: stock === "all" ? undefined : stock, sort }} />
        <p className="mt-3 text-[10px] text-ink/35">{formatNumber(inventory.total)} تنوع مطابق فیلتر — موجودی و ارزش‌ها لحظه‌ای از پایگاه داده خوانده می‌شوند.</p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section>
          <SectionTitle title="پیشنهاد خرید مجدد" subtitle="بر اساس فروش ۳۰ روز، زمان تحویل تأمین‌کننده و آستانه هشدار." href="/admin/inventory/purchase-orders/new" linkLabel="ساخت سفارش خرید" />
          <Card className="overflow-hidden">
            <div className="table-wrap">
              <table className="table-luxury min-w-[720px]">
                <thead><tr><th>کالا</th><th>موجودی</th><th>فروش ۳۰ روز</th><th>پیشنهاد</th><th>تأمین‌کننده</th></tr></thead>
                <tbody>
                  {suggestions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/admin/products/${item.productId}`} className="text-xs font-medium text-primary hover:underline">{item.productName}</Link>
                        <p className="mt-0.5 text-[10px] text-ink/45">{item.size}{item.color ? ` / ${item.color}` : ""} — <span dir="ltr">{item.sku}</span></p>
                      </td>
                      <td className={item.stock === 0 ? "font-semibold text-red-600" : "font-semibold text-amber-600"}>{formatNumber(item.stock)}</td>
                      <td>{formatNumber(item.soldLast30Days)}</td>
                      <td dir="ltr" className="font-semibold text-emerald-700">{formatNumber(item.suggestedQuantity)}</td>
                      <td className="text-[11px] text-ink/55">{item.supplierName ?? "—"}<span className="block text-[10px] text-ink/35">تحویل {formatNumber(item.leadTimeDays)} روز</span></td>
                    </tr>
                  ))}
                  {!suggestions.length ? <tr><td colSpan={5} className="py-8 text-center text-ink/50">همه تنوع‌ها موجودی کافی دارند.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle title="سرمایه خواب‌رفته" subtitle="کالاهای دارای موجودی بدون فروش در ۹۰ روز گذشته." />
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line/70">
              {deadStock.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/products/${item.productId}`} className="block truncate text-xs font-medium hover:text-primary">{item.productName}</Link>
                    <span dir="ltr" className="mt-0.5 block text-[10px] text-ink/40">{item.sku} — {formatNumber(item.stock)} عدد</span>
                  </div>
                  <div className="shrink-0 text-left">
                    <span dir="ltr" className="block text-[11px] font-semibold text-amber-700">{formatToman(item.costValue)}</span>
                    <span className="block text-[10px] text-ink/35">{item.lastSoldAt ? `آخرین فروش ${formatJalali(item.lastSoldAt)}` : "بدون فروش ثبت‌شده"}</span>
                  </div>
                </li>
              ))}
              {!deadStock.length ? <li className="px-4 py-8 text-center text-xs text-ink/45">کالای راکدی یافت نشد.</li> : null}
            </ul>
          </Card>
        </section>
      </div>

      <section>
        <SectionTitle title="آخرین گردش انبار" subtitle="هر ردیف یک حرکت ثبت‌شده با مانده پس از تغییر است." href="/admin/inventory/movements" linkLabel="تاریخچه کامل" />
        <Card className="overflow-hidden">
          <div className="table-wrap">
            <table className="table-luxury">
              <thead><tr><th>تاریخ</th><th>کالا</th><th>تغییر</th><th>مانده</th><th>دلیل</th><th>مرجع</th></tr></thead>
              <tbody>
                {recentMovements.items.map((movement) => (
                  <tr key={movement.id}>
                    <td className="text-xs">{formatJalali(movement.createdAt, true)}</td>
                    <td>
                      <Link href={`/admin/products/${movement.variant.product.id}`} className="text-xs text-primary hover:underline">{movement.variant.product.name}</Link>
                      <p dir="ltr" className="mt-0.5 text-[10px] text-ink/40">{movement.variant.sku}</p>
                    </td>
                    <td dir="ltr" className={movement.quantity > 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-600"}>{movement.quantity > 0 ? "+" : ""}{formatNumber(movement.quantity)}</td>
                    <td dir="ltr" className="text-xs">{movement.balanceAfter === null ? "—" : formatNumber(movement.balanceAfter)}</td>
                    <td className="text-xs">{inventoryReasonLabels[movement.reason]}</td>
                    <td className="text-[10px] text-ink/45">{movement.order ? movement.order.orderNumber : movement.referenceType ?? "—"}</td>
                  </tr>
                ))}
                {!recentMovements.items.length ? <tr><td colSpan={6} className="py-8 text-center text-ink/50">گردشی ثبت نشده است.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <p className="text-[10px] leading-5 text-ink/35">
        تعاریف: «ارزش موجودی (بهای خرید)» سرمایه در گردش انبار است. «ارزش فروش موجودی» مبلغ بالقوه فروش همان موجودی است. «کالای راکد» موجودی بدون فروش در ۹۰ روز است. پیشنهاد خرید مجدد ترکیبی از فروش روزانه ۳۰ روز اخیر، زمان تحویل تأمین‌کننده و آستانه هشدار است و صرفاً پیشنهاد، نه سفارش خودکار.
      </p>
    </div>
  );
}
