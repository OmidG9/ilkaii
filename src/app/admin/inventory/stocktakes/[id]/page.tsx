import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/session";
import { WarehouseTabs } from "@/components/admin/warehouse-tabs";
import { StocktakeActions, StocktakeCountForm } from "@/components/admin/stocktake-manager";
import { Card, Pagination } from "@/components/ui/display";
import { stocktakeStatusLabels } from "@/lib/labels";
import { formatJalali, formatNumber } from "@/lib/persian";
import { getStocktake } from "@/services/warehouse";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "جزئیات انبارگردانی — مدیریت انبار" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<RawSearchParams> };

function statusTone(status: string) {
  if (status === "COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (status === "IN_PROGRESS") return "bg-amber-100 text-amber-800";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-line text-ink/70";
}

export default async function AdminStocktakeDetailPage({ params, searchParams }: Props) {
  await requirePagePermission("inventory.manage");
  const { id } = await params;
  const raw = await searchParams;
  const rawPage = typeof raw.page === "string" ? Number(raw.page) : 1;
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const q = typeof raw.q === "string" ? raw.q.slice(0, 120) : "";
  let data;
  try {
    data = await getStocktake(id, { page, pageSize: 50, q: q || undefined });
  } catch {
    notFound();
  }
  const { stocktake } = data;
  const progress = stocktake.totalItems ? Math.round((stocktake.countedItems / stocktake.totalItems) * 100) : 0;
  const editable = ["DRAFT", "IN_PROGRESS"].includes(stocktake.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 dir="ltr" className="text-2xl font-semibold">{stocktake.number}</h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${statusTone(stocktake.status)}`}>{stocktakeStatusLabels[stocktake.status]}</span>
          </div>
          <p className="mt-2 text-[11px] text-ink/45">
            شروع: {formatJalali(stocktake.startedAt, true)}
            {stocktake.completedAt ? ` — تکمیل: ${formatJalali(stocktake.completedAt, true)}` : ""}
          </p>
          {stocktake.note ? <p className="mt-1 text-xs text-ink/55">{stocktake.note}</p> : null}
        </div>
        <Link href="/admin/inventory/stocktakes" className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-xs hover:border-primary">بازگشت به فهرست</Link>
      </div>
      <WarehouseTabs />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-[11px] text-ink/45">پیشرفت شمارش</p><p className="mt-2 text-lg font-semibold">{formatNumber(stocktake.countedItems)} / {formatNumber(stocktake.totalItems)}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></Card>
        <Card className="p-4"><p className="text-[11px] text-ink/45">اقلام دارای مغایرت</p><p className="mt-2 text-lg font-semibold text-amber-700">{formatNumber(stocktake.varianceItems)}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-ink/45">مغایرت واحد (شمارش − سیستم)</p><p dir="ltr" className={`mt-2 text-lg font-semibold ${stocktake.varianceUnits < 0 ? "text-red-600" : stocktake.varianceUnits > 0 ? "text-sky-700" : ""}`}>{stocktake.varianceUnits > 0 ? "+" : ""}{formatNumber(stocktake.varianceUnits)}</p></Card>
        <Card className="p-4"><p className="text-[11px] text-ink/45">وضعیت</p><p className="mt-2 text-lg font-semibold">{stocktakeStatusLabels[stocktake.status]}</p></Card>
      </div>

      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-56 flex-1 space-y-1.5">
            <span className="block text-xs text-ink/55">جستجو در اقلام</span>
            <input name="q" defaultValue={q} placeholder="نام کالا، SKU یا بارکد" className="field min-h-11 w-full" />
          </label>
          <button type="submit" className="min-h-11 rounded-xl bg-primary px-5 text-sm text-white">جستجو</button>
        </form>
      </Card>

      <Card className="p-5">
        <StocktakeCountForm
          stocktakeId={stocktake.id}
          disabled={!editable}
          items={data.items.map((item) => ({
            id: item.id,
            expectedQuantity: item.expectedQuantity,
            countedQuantity: item.countedQuantity,
            difference: item.difference,
            currentStock: item.currentStock,
            variant: item.variant,
          }))}
        />
        <Pagination page={page} pageCount={data.pageCount} pathname={`/admin/inventory/stocktakes/${stocktake.id}`} params={{ q: q || undefined }} />
      </Card>

      <StocktakeActions stocktakeId={stocktake.id} status={stocktake.status} />

      <p className="text-[10px] leading-5 text-ink/35">
        «موجودی سیستم» هنگام شروع انبارگردانی ثبت شده است. هنگام تکمیل، مغایرت (شمارش − سیستم) به موجودی فعلی اضافه می‌شود تا فروش‌های پس از شروع شمارش از بین نروند. هر اصلاح یک حرکت «انبارگردانی» با مانده جدید در دفتر انبار ثبت می‌کند.
      </p>
    </div>
  );
}
