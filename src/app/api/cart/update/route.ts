import { NextRequest } from "next/server";
import { cartService } from "@/services";
import { updateCartItemSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

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
      session.user.id,
      cartItemId,
      validatedQuantity,
    );

    return successResponse(item, "Cart updated");
  } catch (error) {
    return handleApiError(error);
  }
}
