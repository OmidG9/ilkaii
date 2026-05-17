import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validators";
import {
  successResponse,
  handleApiError,
  ApiError,
  slugify,
} from "@/lib/utils";
import { auth } from "@/auth";

async function checkAdminAccess() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized - Please login first");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError(403, "Forbidden - Admin access required");
  }

  return user;
}

export async function POST(req: NextRequest) {
  try {
    await checkAdminAccess();

    const body = await req.json();
    const data = createCategorySchema.parse(body);

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ApiError(400, "Slug already exists");
    }

    const category = await prisma.category.create({
      data: {
        ...data,
        slug: data.slug || slugify(data.name),
      },
    });

    return successResponse(category, "Category created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await checkAdminAccess();

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const skip = (page - 1) * pageSize;

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        skip,
        take: pageSize,
        include: { _count: { select: { products: true } } },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.category.count(),
    ]);

    return successResponse({
      data: categories,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
