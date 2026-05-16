import { NextRequest } from "next/server";
import { cartService } from "@/services";
import { removeFromCartSchema } from "@/lib/validators";
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
    const userId = await getUserId(req);
    const body = await req.json();

    const { cartItemId } = removeFromCartSchema.parse(body);

    await cartService.removeFromCart(userId, cartItemId);

    return successResponse(null, "Item removed from cart");
  } catch (error) {
    return handleApiError(error);
  }
}
