import { NextRequest } from "next/server";
import { orderService } from "@/services";
import { createOrderSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import prisma from "@/lib/prisma";

// Mock auth - In real app use NextAuth session
async function getUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized - No user ID");
  }
  return userId;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();

    // Validate request
    const orderData = createOrderSchema.parse(body);

    // Create order
    const order = await orderService.createOrder(userId, orderData);

    // Initiate payment
    const baseUrl = req.nextUrl.origin;
    const callbackUrl = `${baseUrl}/checkout/verify`;

    const paymentLink = await orderService.initiatePayment(
      order.id,
      callbackUrl,
    );

    return successResponse(
      {
        order,
        payment: paymentLink,
      },
      "Order created successfully. Proceed to payment.",
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
