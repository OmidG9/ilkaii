import { NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { requireAnyPermission } from "@/lib/auth/session";
import { exportInventoryCsv, type InventoryStockFilter } from "@/services/warehouse";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await requireAnyPermission("inventory.manage", "inventory.write", "reports.view");
  const params = request.nextUrl.searchParams;
  const stockValue = params.get("stock");
  const stock: InventoryStockFilter = stockValue === "out" || stockValue === "low" || stockValue === "ok" ? stockValue : "all";
  const csv = await exportInventoryCsv({
    q: params.get("q")?.slice(0, 120) || undefined,
    categoryId: params.get("category")?.slice(0, 64) || undefined,
    stock,
  });
  await audit({ actorId: user.id, action: "inventory.exported", entity: "Inventory", metadata: { q: params.get("q") ?? null, stock }, severity: "warn" });
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ilkaii-inventory-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
