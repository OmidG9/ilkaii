import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { AdminPageHeader } from "@/components/admin/admin-widgets";
import { Card, Pagination } from "@/components/ui/display";
import { ButtonLink } from "@/components/ui/button";
import { stocktakeStatusLabels } from "@/lib/labels";
import { formatJalali, formatNumber } from "@/lib/persian";
import { listStocktakes } from "@/services/warehouse";
import type { StocktakeStatus } from "@prisma/client";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "انبارگردانی — مدیریت انبار" };
export const dynamic = "force-dynamic";

const statuses: StocktakeStatus[] = ["DRAFT", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function parseStatus(value: string | undefined): StocktakeStatus | undefined {
  return statuses.find((status) => status === value);
}

function statusTone(status: StocktakeStatus) {
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (status === "IN_PROGRESS") return "bg-amber-100 text-amber-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-line text-ink/70";
}

export default async function AdminStocktakesPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  await requirePagePermission("inventory.manage");
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? Number(params.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const status = parseStatus(typeof params.status === "string" ? params.status : undefined);
  const result = await listStocktakes({ page, pageSize: 15, status });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="انبارگردانی"
        description="شمارش فیزیکی موجودی با اسنپ‌شات زمان شروع؛ مغایرت‌ها فقط پس از تأیید نهایی روی موجودی اعمال می‌شوند."
        actions={<ButtonLink href="/admin/inventory/stocktakes/new" size="sm">انبارگردانی جدید</ButtonLink>}
      />
      <WarehouseTabs />

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="space-y-1.5">
            <span className="block text-xs text-ink/55">وضعیت</span>
            <select name="status" defaultValue={status ?? ""} className="field min-h-11 min-w-48 cursor-pointer">
              <option value="">همه</option>
              {statuses.map((item) => <option key={item} value={item}>{stocktakeStatusLabels[item]}</option>)}
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-xl bg-primary px-5 text-sm text-white">اعمال</button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="table-wrap">
          <table className="table-luxury min-w-[860px]">
            <thead><tr><th>شماره</th><th>وضعیت</th><th>پیشرفت شمارش</th><th>مغایرت اقلام</th><th>مغایرت واحد</th><th>شروع</th><th>تکمیل</th></tr></thead>
            <tbody>
              {result.items.map((stocktake) => {
                const progress = stocktake.totalItems ? Math.round((stocktake.countedItems / stocktake.totalItems) * 100) : 0;
                return (
                  <tr key={stocktake.id}>
                    <td><Link href={`/admin/inventory/stocktakes/${stocktake.id}`} dir="ltr" className="text-xs font-medium text-primary hover:underline">{stocktake.number}</Link></td>
                    <td><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${statusTone(stocktake.status)}`}>{stocktakeStatusLabels[stocktake.status]}</span></td>
                    <td className="min-w-40">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-ink/55">{formatNumber(stocktake.countedItems)} / {formatNumber(stocktake.totalItems)}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></span>
                      </div>
                    </td>
                    <td className={stocktake.varianceItems ? "font-semibold text-amber-700" : "text-ink/50"}>{formatNumber(stocktake.varianceItems)}</td>
                    <td dir="ltr" className={stocktake.varianceUnits < 0 ? "text-red-600" : stocktake.varianceUnits > 0 ? "text-sky-700" : "text-ink/50"}>{stocktake.varianceUnits > 0 ? "+" : ""}{formatNumber(stocktake.varianceUnits)}</td>
                    <td className="text-xs">{formatJalali(stocktake.startedAt)}</td>
                    <td className="text-xs">{stocktake.completedAt ? formatJalali(stocktake.completedAt) : "—"}</td>
                  </tr>
                );
              })}
              {!result.items.length ? <tr><td colSpan={7} className="py-10 text-center text-ink/50">انبارگردانی‌ای یافت نشد.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </Card>
      <Pagination page={page} pageCount={result.pageCount} pathname="/admin/inventory/stocktakes" params={{ status }} />
    </div>
  );
}
