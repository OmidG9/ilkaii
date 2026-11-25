import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runMaintenanceJob } from "@/services/system";
import { isProduction } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return !isProduction();
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : request.nextUrl.searchParams.get("secret") ?? "";
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function handle(request: NextRequest) {
  if (!authorized(request)) return Response.json({ ok: false }, { status: 404 });
  try {
    const result = await runMaintenanceJob();
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
