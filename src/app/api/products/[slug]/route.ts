import { NextRequest } from "next/server";
import { productsService } from "@/services";
import { successResponse, handleApiError } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const product = await productsService.getProduct(slug);
    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}
