import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { paymentResumeUrl } from "@/services/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Send the customer back to an existing gateway session for a pending order.
 * Abandoning the gateway page must not force the shopper to rebuild their cart.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const orderNumber = request.nextUrl.searchParams.get("order")?.trim().slice(0, 64) ?? "";
  const resumePath = `/api/payments/resume?order=${encodeURIComponent(orderNumber)}`;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(resumePath)}`, origin));
  }

  const detailUrl = new URL(`/account/orders/${encodeURIComponent(orderNumber)}`, origin);
  if (!orderNumber) return NextResponse.redirect(new URL("/account/orders", origin));

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: user.id },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      payments: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { provider: true, authority: true },
      },
    },
  });
  if (!order) return NextResponse.redirect(detailUrl);

  if (order.status !== "PENDING_PAYMENT" || order.paymentStatus !== "PENDING") {
    return NextResponse.redirect(new URL(`/checkout/result?${new URLSearchParams({
      order: order.orderNumber,
      status: "pending",
    })}`, origin));
  }

  const payment = order.payments[0];
  const gatewayUrl = paymentResumeUrl(
    payment?.provider ?? "",
    payment?.authority ?? null,
    order.id,
  );
  if (!gatewayUrl) return NextResponse.redirect(detailUrl);

  return NextResponse.redirect(new URL(gatewayUrl, origin));
}
