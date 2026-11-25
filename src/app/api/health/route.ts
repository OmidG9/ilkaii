import { checkHealth } from "@/services/system";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public minimal health endpoint: no infrastructure details or secrets. */
export async function GET() {
  const health = await checkHealth();
  return Response.json(
    { status: health.status, database: health.database, checkedAt: health.checkedAt },
    { status: health.status === "down" ? 503 : 200, headers: { "cache-control": "no-store" } },
  );
}
