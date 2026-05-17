import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";
import { auth } from "@/auth";

const prisma = (globalThis as any).prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;

export const metadata: Metadata = {
  title: "نهایی‌سازی خرید | ilkaii",
};

async function submitCheckout(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?redirect=/checkout");
  }

  const userId = session.user.id;
  const userPhone = session.user.phone as string;

  const fullName = formData.get("fullName")?.toString() ?? "";
  const phone = formData.get("phone")?.toString() ?? userPhone ?? "";
  const address = formData.get("address")?.toString() ?? "";
  const postalCode = formData.get("postalCode")?.toString() ?? "";
  const city = formData.get("city")?.toString() ?? "";
  const country = formData.get("country")?.toString() ?? "";
  const paymentMethod =
    formData.get("paymentMethod")?.toString() ?? "NETBANKING";
  const cartJson = formData.get("cartJson")?.toString() ?? "[]";

  const cartItems = JSON.parse(cartJson) as Array<{
    id: string;
    productId: string;
    slug: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
  }>;

  if (!cartItems.length) {
    throw new Error("سبد خرید خالی است. قبل از پرداخت، محصولی اضافه کنید.");
  }

  const selectedPaymentMethod =
    paymentMethod === "DEBIT_CARD" ? "DEBIT_CARD" : "NETBANKING";

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const order = await prisma.order.create({
    data: {
      userId,
      orderNumber: `ORD-${Date.now()}`,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: selectedPaymentMethod,
      subtotal: totalAmount,
      taxAmount: 0,
      shippingCost: 0,
      totalAmount,
      discountAmount: 0,
      deliveryAddress: {
        create: {
          userId,
          label: "آدرس ارسال",
          fullName,
          phone,
          street: address,
          city,
          state: country,
          postalCode,
          country,
          isDefault: false,
        },
      },
      items: {
        create: cartItems.map((item) => ({
          product: {
            connect: {
              slug: item.slug,
            },
          },
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity,
        })),
      },
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  if (selectedPaymentMethod === "DEBIT_CARD") {
    const transactionId = `CARD2CARD-${Date.now()}`;
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount,
        status: "COMPLETED",
        gateway: "CARD_TO_CARD",
        refId: transactionId,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "COMPLETED",
        status: "CONFIRMED",
        transactionId,
      },
    });

    redirect(`${baseUrl}/checkout?payment=success&method=cardtocard`);
    return;
  }

  const response = await fetch(`${baseUrl}/api/zarinpal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId: order.id,
      amount: totalAmount,
      description: `سفارش ${order.id} از ilkaii`,
    }),
  });

  const data = await response.json();
  if (!data?.success || !data?.url) {
    throw new Error(data?.message ?? "Unable to initiate payment.");
  }

  redirect(data.url);
}

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login?redirect=/checkout");
  }

  return (
    <CheckoutClient
      action={submitCheckout}
      defaultPhone={session.user.phone as string}
    />
  );
}
