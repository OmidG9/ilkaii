import { NextRequest } from "next/server";
import { cartService } from "@/services";
import { removeFromCartSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const body = await req.json();

    const { cartItemId } = removeFromCartSchema.parse(body);

    await cartService.removeFromCart(session.user.id, cartItemId);

    return successResponse(null, "Item removed from cart");
  } catch (error) {
    return handleApiError(error);
  }
}
