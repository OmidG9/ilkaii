import { NextRequest } from "next/server";
import { cartService } from "@/services";
import { addToCartSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const body = await req.json();

    const { productId, variantId, quantity } = addToCartSchema.parse(body);

    const item = await cartService.addToCart(
      session.user.id,
      productId,
      quantity,
      variantId,
    );

    return successResponse(item, "Item added to cart", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
