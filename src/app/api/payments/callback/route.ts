import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentProvider, mockProvider } from "@/services/payment";
import { finalizePayment } from "@/services/checkout";
import { toToman } from "@/lib/money";

export const runtime = "nodejs";

function redirect(orderNumber: string | undefined, status: "success" | "failed") {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${base}/checkout/result?${new URLSearchParams({
    order: orderNumber ?? "", status,
  })}`);
}

/**
 * Idempotent gateway callback. The authority and amount are verified against
 * the database with the configured provider before any state is changed.
 */
async function handle(request: NextRequest) {
  const params = request.method === "GET" ? request.nextUrl.searchParams : new URLSearchParams(await request.text());
  const authority = params.get("Authority") ?? params.get("authority");
  const providerName = params.get("provider") ?? "ZARINPAL";
  if (!authority) return redirect(undefined, "failed");

  const payment = await prisma.payment.findUnique({ where: { authority }, include: { order: { select: { orderNumber: true } } } });
  if (!payment || payment.provider !== providerName) return redirect(undefined, "failed");

  if (payment.status === "PAID") return redirect(payment.order.orderNumber, "success");

  let okPayment = false;
  let reference: string | undefined;
  try {
    const provider = providerName === "MOCK" ? mockProvider : getPaymentProvider();
    if (provider.name !== payment.provider) return redirect(payment.order.orderNumber, "failed");
    const verified = await provider.verify({ authority, amountToman: toToman(payment.amount) });
    okPayment = verified.ok && (params.get("Status") !== "NOK");
    reference = verified.reference;
  } catch {
    okPayment = false;
  }

  await finalizePayment({ authority, success: okPayment, reference, rawResponse: Object.fromEntries(params) });
  return redirect(payment.order.orderNumber, okPayment ? "success" : "failed");
}

export const GET = handle;
export const POST = handle;
