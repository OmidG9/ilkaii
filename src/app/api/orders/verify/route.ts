import { NextRequest } from "next/server";
import { orderService } from "@/services";
import { verifyPaymentSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function getUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized - No user ID");
  }
  return userId;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request
    const { authority } = verifyPaymentSchema.parse(body);

    // Verify payment
    const result = await orderService.verifyPayment(authority);

    return successResponse(
      {
        order: result.order,
        refId: result.refId,
      },
      "Payment verified successfully",
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// GET endpoint for callback
export async function GET(req: NextRequest) {
  try {
    const authority = req.nextUrl.searchParams.get("Authority");
    const status = req.nextUrl.searchParams.get("Status");

    if (!authority) {
      throw new ApiError(400, "Missing authority parameter");
    }

    if (status !== "OK") {
      throw new ApiError(400, "Payment cancelled by user");
    }

    // Verify payment
    const result = await orderService.verifyPayment(authority);

    // Redirect to success page
    const baseUrl = req.nextUrl.origin;
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}/checkout/success?orderId=${result.order.id}&refId=${result.refId}`,
      },
    });
  } catch (error) {
    // Redirect to error page
    const baseUrl = req.nextUrl.origin;
    let errorMessage = "Payment verification failed";

    if (error instanceof ApiError) {
      errorMessage = error.message;
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: `${baseUrl}/checkout/failed?error=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
}
