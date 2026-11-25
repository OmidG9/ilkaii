import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth/session";
import { resolveDateRange } from "@/lib/date-range";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

function escape(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+@]/.test(text) || (/^-/.test(text) && Number.isNaN(Number(text)))) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: NextRequest) {
  const user = await requirePermission("analytics.export");
  const params = request.nextUrl.searchParams;
  const range = resolveDateRange({ range: params.get("range") ?? undefined, from: params.get("from") ?? undefined, to: params.get("to") ?? undefined });
  const sessions = await prisma.analyticsSession.findMany({
    where: { firstSeenAt: { gte: range.from, lte: range.to } },
    orderBy: { firstSeenAt: "desc" },
    take: 5000,
    select: {
      id: true, firstSeenAt: true, lastSeenAt: true, entryPath: true, exitPath: true,
      referrer: true, utmSource: true, utmMedium: true, utmCampaign: true,
      device: true, browser: true, pageViews: true, eventCount: true, isBounced: true,
    },
  });
  const header = ["session_id", "first_seen", "last_seen", "entry_path", "exit_path", "referrer", "utm_source", "utm_medium", "utm_campaign", "device", "browser", "page_views", "events", "bounced"];
  const lines = sessions.map((session) => [
    session.id, session.firstSeenAt.toISOString(), session.lastSeenAt.toISOString(),
    session.entryPath, session.exitPath, session.referrer, session.utmSource, session.utmMedium,
    session.utmCampaign, session.device, session.browser, session.pageViews, session.eventCount,
    session.isBounced ? "1" : "0",
  ].map(escape).join(","));
  await audit({ actorId: user.id, action: "analytics.exported", entity: "AnalyticsSession", metadata: { count: sessions.length, range: range.key }, severity: "warn" });
  return new Response(`\uFEFF${header.join(",")}\n${lines.join("\n")}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ilkaii-analytics-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
