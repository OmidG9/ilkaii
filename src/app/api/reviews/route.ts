import { NextRequest } from "next/server";
import { createReviewSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import prisma from "@/lib/prisma";

async function getUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  return userId;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const data = createReviewSchema.parse(body);

    // Check if user purchased this product
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: data.productId,
        order: { userId },
      },
    });

    if (!purchase) {
      throw new ApiError(
        400,
        "You can only review products you have purchased",
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        productId: data.productId,
        userId,
      },
    });

    if (existingReview) {
      throw new ApiError(400, "You have already reviewed this product");
    }

    const review = await prisma.review.create({
      data: {
        ...data,
        userId,
        isVerified: true, // Mark as verified since user purchased it
      },
    });

    // Update product rating
    const reviews = await prisma.review.findMany({
      where: { productId: data.productId },
    });

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await prisma.product.update({
      where: { id: data.productId },
      data: {
        averageRating: avgRating,
        reviewCount: reviews.length,
      },
    });

    return successResponse(review, "Review submitted successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
