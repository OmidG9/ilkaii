import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = (globalThis as any).prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;

const ZARINPAL_API_BASE = "https://api.zarinpal.com/pg/v4/payment";

async function createZarinpalRequest(
  orderId: string,
  amount: number,
  description: string,
  callbackUrl: string,
) {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;
  if (!merchantId) {
    throw new Error("Missing ZARINPAL_MERCHANT_ID environment variable.");
  }

  const response = await fetch(`${ZARINPAL_API_BASE}/request.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount,
      callback_url: callbackUrl,
      description,
      metadata: { orderId },
    }),
  });

  const data = await response.json();
  return data;
}

async function verifyZarinpalPayment(authority: string, amount: number) {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;
  if (!merchantId) {
    throw new Error("Missing ZARINPAL_MERCHANT_ID environment variable.");
  }

  const response = await fetch(`${ZARINPAL_API_BASE}/verify.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount,
      authority,
    }),
  });

  const data = await response.json();
  return data;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orderId, amount, description } = body;
  if (!orderId || !amount || !description) {
    return NextResponse.json(
      { success: false, message: "Invalid payment payload." },
      { status: 400 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? request.nextUrl.origin;
  const callbackUrl = `${baseUrl}/api/zarinpal?orderId=${orderId}`;
  const result = await createZarinpalRequest(
    orderId,
    amount,
    description,
    callbackUrl,
  );

  if (result?.data?.authority) {
    return NextResponse.json({ success: true, url: result.data.url });
  }

  return NextResponse.json(
    {
      success: false,
      message: result?.errors?.message ?? "Payment gateway error.",
    },
    { status: 500 },
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("Status");
  const authority =
    searchParams.get("authority") ?? searchParams.get("Authority");

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? request.nextUrl.origin;
  const fallbackRedirect = `${baseUrl}/checkout`;

  if (!orderId || !status || !authority) {
    return NextResponse.redirect(fallbackRedirect);
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.redirect(fallbackRedirect);
  }

  if (status !== "OK") {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });
    return NextResponse.redirect(`${baseUrl}/checkout?payment=failed`);
  }

  const verification = await verifyZarinpalPayment(
    authority,
    Number(order.totalAmount),
  );
  if (verification?.data?.code === 100) {
    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        authority,
        refId: verification.data.ref_id,
        amount: order.totalAmount,
        currency: order.currency,
        status: "SUCCESS",
      },
      update: {
        authority,
        refId: verification.data.ref_id,
        status: "SUCCESS",
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paymentId: payment.id },
    });
    return NextResponse.redirect(`${baseUrl}/checkout?payment=success`);
  }

  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      authority,
      amount: order.totalAmount,
      currency: order.currency,
      status: "FAILED",
    },
    update: { status: "FAILED" },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED", paymentStatus: "FAILED" },
  });
  return NextResponse.redirect(`${baseUrl}/checkout?payment=failed`);
}
