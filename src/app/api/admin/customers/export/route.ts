import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/session";
import { listCustomers, customersToCsv, type CustomerSegmentKey } from "@/services/crm";
import { CUSTOMER_SEGMENTS } from "@/services/crm";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await requirePermission("customers.export");
  const params = request.nextUrl.searchParams;
  const rawSegment = params.get("segment") ?? "";
  const segment = CUSTOMER_SEGMENTS.some((item) => item.key === rawSegment) ? rawSegment as CustomerSegmentKey : undefined;
  const numberParam = (key: string) => {
    const value = Number(params.get(key));
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  };
  const result = await listCustomers({
    page: 1,
    pageSize: 5000,
    q: params.get("q")?.slice(0, 120) || undefined,
    segment,
    minSpend: numberParam("minSpend"),
    maxSpend: numberParam("maxSpend"),
    minOrders: numberParam("minOrders"),
    maxOrders: numberParam("maxOrders"),
    sort: "spend",
  });
  await audit({ actorId: user.id, action: "customers.exported", entity: "User", metadata: { count: result.items.length, filters: Object.fromEntries(params) }, severity: "warn" });
  return new Response(customersToCsv(result.items), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ilkaii-customers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
