import { NextRequest, NextResponse } from "next/server";
import { isProduction } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Backward-compatible entry point for old pending mock payments. New payments
 * go directly to the interactive sandbox page, where the shopper can choose a
 * successful or failed outcome before returning to the storefront.
 */
export async function GET(request: NextRequest) {
  if (isProduction()) return new Response(null, { status: 404 });
  const orderId = request.nextUrl.searchParams.get("order");
  if (!orderId) return new Response("Missing order", { status: 400 });
  const url = new URL("/payment-sandbox", request.nextUrl.origin);
  url.searchParams.set("order", orderId);
  return NextResponse.redirect(url);
}
