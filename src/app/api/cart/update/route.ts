import { NextRequest } from "next/server";
import { cartService } from "@/services";
import { updateCartItemSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function getUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized - No user ID");
  }
  return userId;
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const { cartItemId, quantity } = {
      cartItemId: req.nextUrl.searchParams.get("cartItemId") || body.cartItemId,
      quantity: body.quantity,
    };

    if (!cartItemId) {
      throw new ApiError(400, "Cart item ID is required");
    }

    const { quantity: validatedQuantity } = updateCartItemSchema.parse({
      quantity,
    });

    const item = await cartService.updateCart(
      userId,
      cartItemId,
      validatedQuantity,
    );

    return successResponse(item, "Cart updated");
  } catch (error) {
    return handleApiError(error);
  }
}
