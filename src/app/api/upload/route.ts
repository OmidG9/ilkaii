import { NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getUserRole(req: NextRequest): Promise<string> {
  const role = req.headers.get("x-user-role") || "CUSTOMER";
  return role;
}

export async function POST(req: NextRequest) {
  try {
    // Admin only
    const role = await getUserRole(req);
    if (role !== "ADMIN") {
      throw new ApiError(403, "Forbidden - Admin only");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new ApiError(400, "File is required");
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new ApiError(400, "Only image files are allowed");
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "ilkaii/products",
          resource_type: "auto",
          quality: "auto",
          fetch_format: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );

      uploadStream.end(buffer);
    });

    const uploadResult = result as any;

    return successResponse(
      {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      },
      "Image uploaded successfully",
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Admin only
    const role = await getUserRole(req);
    if (role !== "ADMIN") {
      throw new ApiError(403, "Forbidden - Admin only");
    }

    const body = await req.json();
    const { publicId } = body;

    if (!publicId) {
      throw new ApiError(400, "Public ID is required");
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      throw new ApiError(400, "Failed to delete image");
    }

    return successResponse(null, "Image deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
