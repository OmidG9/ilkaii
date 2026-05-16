import { NextRequest } from "next/server";
import { addressesRepo } from "@/lib/repositories";
import { createAddressSchema, updateAddressSchema } from "@/lib/validators";
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
    const addresses = await addressesRepo.getByUserId(userId);
    return successResponse(addresses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const data = createAddressSchema.parse(body);

    const address = await addressesRepo.create({
      ...data,
      userId,
    });

    return successResponse(address, "Address added successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
