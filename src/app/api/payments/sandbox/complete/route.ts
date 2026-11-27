import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isProduction } from "@/lib/env";
import { finalizePayment } from "@/services/checkout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resultRedirect(request: NextRequest, orderNumber: string, status: "success" | "failed" | "review") {
  const url = new URL("/checkout/result", request.nextUrl.origin);
  url.searchParams.set("order", orderNumber);
  url.searchParams.set("status", status);
  return NextResponse.redirect(url);
}

/** Completes a development-only simulated payment and returns to this origin. */
export async function POST(request: NextRequest) {
  if (isProduction()) return new Response(null, { status: 404 });

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(await request.text());
  } catch {
    return NextResponse.redirect(new URL("/checkout/result?status=failed", request.nextUrl.origin));
  }

  const authority = params.get("authority")?.trim() ?? "";
  const outcome = params.get("outcome") === "success" ? "success" : "failed";
  if (!authority || authority.length > 120) {
    return NextResponse.redirect(new URL("/checkout/result?status=failed", request.nextUrl.origin));
  }

  const payment = await prisma.payment.findUnique({
    where: { authority },
    include: { order: { select: { orderNumber: true, userId: true } } },
  });
  if (!payment || payment.provider !== "MOCK") {
    return NextResponse.redirect(new URL("/checkout/result?status=failed", request.nextUrl.origin));
  }

  try {
    const result = await finalizePayment({
      authority,
      success: outcome === "success",
      reference: outcome === "success" ? `SANDBOX-${payment.order.orderNumber}` : undefined,
      rawResponse: { sandbox: true, outcome },
    });
    return resultRedirect(
      request,
      payment.order.orderNumber,
      result.requiresReview ? "review" : outcome === "success" ? "success" : "failed",
    );
  } catch (error) {
    console.error("sandbox_payment_finalize_failed", {
      orderNumber: payment.order.orderNumber,
      message: error instanceof Error ? error.message : String(error),
    });
    return resultRedirect(request, payment.order.orderNumber, "review");
  }
}
