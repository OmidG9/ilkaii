import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        icon: true,
        displayOrder: true,
        _count: { select: { products: true } },
      },
      orderBy: { displayOrder: "asc" },
    });

    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
