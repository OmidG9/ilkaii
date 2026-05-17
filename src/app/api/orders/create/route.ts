import { NextRequest } from "next/server";
import { orderService } from "@/services";
import { createOrderSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const body = await req.json();

    // Validate request
    const orderData = createOrderSchema.parse(body);

    // Create order
    const order = await orderService.createOrder(session.user.id, orderData);

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
