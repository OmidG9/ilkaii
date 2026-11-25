import { NextRequest } from "next/server";
import { ok, route } from "@/lib/http";
import { requireUser } from "@/lib/auth/session";
import { listUserOrders } from "@/services/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async (request: NextRequest) => {
  const user = await requireUser();
  const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
  return ok(await listUserOrders(user.id, Number.isFinite(page) && page > 0 ? page : 1));
});
