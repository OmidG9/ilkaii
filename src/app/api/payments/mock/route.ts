import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isProduction } from "@/lib/env";
import { finalizePayment } from "@/services/checkout";

export const runtime = "nodejs";

/** Local development checkout simulator. Always 404 in production. */
export async function GET(request: NextRequest) {
  if (isProduction()) return new Response(null, { status: 404 });
  const orderId = request.nextUrl.searchParams.get("order");
  if (!orderId) return new Response("Missing order", { status: 400 });
  const payment = await prisma.payment.findFirst({ where: { orderId, provider: "MOCK" }, include: { order: { select: { orderNumber: true } } } });
  if (!payment?.authority) return new Response("Payment not found", { status: 404 });
  await finalizePayment({ authority: payment.authority, success: true, reference: `MOCK-${payment.order.orderNumber}` });
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${base}/checkout/result?${new URLSearchParams({ order: payment.order.orderNumber, status: "success" })}`);
}
