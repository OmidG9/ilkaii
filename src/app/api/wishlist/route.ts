import { NextRequest } from "next/server";
import { wishlistService } from "@/services";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function getUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");

    const wishlist = await wishlistService.getWishlist(userId, page);
    return successResponse(wishlist);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    const item = await wishlistService.addToWishlist(userId, productId);
    return successResponse(item, "Added to wishlist", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    await wishlistService.removeFromWishlist(userId, productId);
    return successResponse(null, "Removed from wishlist");
  } catch (error) {
    return handleApiError(error);
  }
}
