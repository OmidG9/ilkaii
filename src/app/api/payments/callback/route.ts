import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentProviderFor } from "@/services/payment";
import { finalizePayment } from "@/services/checkout";
import { recordSystemEvent } from "@/services/system";
import { toToman } from "@/lib/money";

export const runtime = "nodejs";

type CallbackStatus = "success" | "failed" | "pending" | "review";

function redirectResponse(request: NextRequest, orderNumber: string | undefined, status: CallbackStatus) {
  // In development the app may run on a different port than
  // NEXT_PUBLIC_BASE_URL (the dev script uses :3500). Always return to the
  // origin that received the callback there; production keeps the canonical
  // configured public URL for proxies.
  const base = process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_BASE_URL ?? request.nextUrl.origin
    : request.nextUrl.origin;
  const url = new URL("/checkout/result", base);
  url.search = new URLSearchParams({
    order: orderNumber ?? "",
    status,
  }).toString();
  return NextResponse.redirect(url);
}

function statusParam(params: URLSearchParams) {
  return (params.get("Status") ?? params.get("status") ?? "OK").toUpperCase();
}

/**
 * Idempotent gateway callback. The authority and amount are verified against
 * the database with the provider recorded on the payment before any state is
 * changed. Transient gateway errors leave the payment pending (never cancel a
 * possibly-paid order).
 */
async function handle(request: NextRequest) {
  const redirect = (orderNumber: string | undefined, status: CallbackStatus) =>
    redirectResponse(request, orderNumber, status);

  let params: URLSearchParams;
  try {
    params = request.method === "GET"
      ? request.nextUrl.searchParams
      : new URLSearchParams(await request.text());
  } catch {
    return redirect(undefined, "failed");
  }

  const authority = params.get("Authority")
    ?? params.get("authority")
    ?? params.get("trackId")
    ?? params.get("RefId");
  if (!authority) return redirect(undefined, "failed");
  const callbackParams = Object.fromEntries(params);

  const payment = await prisma.payment.findUnique({
    where: { authority },
    include: { order: { select: { orderNumber: true, status: true, paymentStatus: true } } },
  });
  if (!payment) return redirect(undefined, "failed");

  const requestedProvider = params.get("provider");
  if (requestedProvider && requestedProvider !== payment.provider) {
    return redirect(payment.order.orderNumber, "failed");
  }

  if (payment.status === "PAID") {
    const cancelled = ["CANCELLED", "REFUNDED"].includes(payment.order.status);
    return redirect(payment.order.orderNumber, cancelled ? "review" : "success");
  }
  if (payment.status === "REFUNDED") return redirect(payment.order.orderNumber, "review");

  if (payment.status === "FAILED") {
    // Usually a replayed cancellation. If the gateway now says the money was
    // captured, record it as paid-for-review instead of losing the payment.
    if (statusParam(params) === "NOK") return redirect(payment.order.orderNumber, "failed");
    try {
      const verified = await getPaymentProviderFor(payment.provider).verify({
        authority,
        amountToman: toToman(payment.amount),
        callback: callbackParams,
      });
      if (!verified.ok) return redirect(payment.order.orderNumber, "failed");
      const result = await finalizePayment({
        authority,
        success: true,
        reference: verified.reference,
        rawResponse: Object.fromEntries(params),
      });
      return redirect(payment.order.orderNumber, result.requiresReview ? "review" : "success");
    } catch {
      await recordSystemEvent("error", "payment", "Paid callback for a failed payment could not be reconciled", {
        orderId: payment.orderId,
      });
      return redirect(payment.order.orderNumber, "review");
    }
  }

  if (statusParam(params) === "NOK") {
    try {
      await finalizePayment({ authority, success: false, rawResponse: Object.fromEntries(params) });
    } catch {
      await recordSystemEvent("warn", "payment", "Failed payment could not be finalized", { orderId: payment.orderId });
    }
    return redirect(payment.order.orderNumber, "failed");
  }

  let verified: { ok: boolean; reference?: string; message?: string };
  try {
    verified = await getPaymentProviderFor(payment.provider).verify({
      authority,
      amountToman: toToman(payment.amount),
      callback: callbackParams,
    });
  } catch {
    // Gateway/network error: keep the order pending and let a callback retry or
    // support reconcile it. Cancelling here could destroy a paid order.
    await recordSystemEvent("warn", "payment", "Gateway verification temporarily unavailable", {
      orderId: payment.orderId,
    });
    return redirect(payment.order.orderNumber, "pending");
  }

  if (!verified.ok) {
    try {
      await finalizePayment({ authority, success: false, rawResponse: Object.fromEntries(params) });
    } catch {
      await recordSystemEvent("warn", "payment", "Payment verification failed and state could not be finalized", {
        orderId: payment.orderId,
      });
    }
    return redirect(payment.order.orderNumber, "failed");
  }

  try {
    const result = await finalizePayment({
      authority,
      success: true,
      reference: verified.reference,
      rawResponse: Object.fromEntries(params),
    });
    return redirect(payment.order.orderNumber, result.requiresReview ? "review" : "success");
  } catch (error) {
    await recordSystemEvent("error", "payment", "Payment succeeded but finalization failed", {
      orderId: payment.orderId,
      error: error instanceof Error ? error.message : String(error),
    });
    return redirect(payment.order.orderNumber, "pending");
  }
}

export const GET = handle;
export const POST = handle;
