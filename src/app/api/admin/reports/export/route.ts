import { NextRequest } from "next/server";
import { requireAnyPermission } from "@/lib/auth/session";
import { resolveDateRange } from "@/lib/date-range";
import { REPORT_TYPES, buildReport, reportToCsv, type ReportGroup, type ReportType } from "@/services/reports";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

function isReportType(value: string | null): value is ReportType {
  return REPORT_TYPES.some((item) => item.key === value);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rawType = params.get("type");
  const type: ReportType = isReportType(rawType) ? rawType : "sales";
  const user = type === "customers"
    ? await requireAnyPermission("customers.export")
    : await requireAnyPermission("reports.view", "analytics.export");
  const group: ReportGroup = params.get("group") === "week" || params.get("group") === "month" ? params.get("group") as ReportGroup : "day";
  const range = resolveDateRange({
    range: params.get("range") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });
  const report = await buildReport(type, range, group);
  await audit({ actorId: user.id, action: "report.exported", entity: "Report", metadata: { type, group, range: range.key }, severity: "warn" });
  return new Response(reportToCsv(report), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ilkaii-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
