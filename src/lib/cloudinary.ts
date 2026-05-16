import { v2 as cloudinary } from "cloudinary";
import env from "@/lib/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const CloudinaryService = {
  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    file: File | Buffer,
    folder: string = "ilkaii",
  ): Promise<{ url: string; publicId: string }> {
    try {
      let uploadStream;

      if (file instanceof File) {
        const buffer = await file.arrayBuffer();
        uploadStream = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: "auto",
              quality: "auto",
              fetch_format: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );

          stream.end(Buffer.from(buffer));
        });
      } else {
        uploadStream = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: "auto",
              quality: "auto",
              fetch_format: "auto",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );

          stream.end(file);
        });
      }

      return {
        url: (uploadStream as any).secure_url,
        publicId: (uploadStream as any).public_id,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload image");
    }
  },

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error("Failed to delete image");
    }
  },

  /**
   * Optimize image URL
   */
  optimizeUrl(
    publicId: string,
    {
      width,
      height,
      crop = "fill",
      quality = "auto",
    }: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
    } = {},
  ): string {
    const transformations: any[] = [
      {
        quality,
        fetch_format: "auto",
      },
    ];

    if (width || height) {
      transformations.push({
        width: width || "auto",
        height: height || "auto",
        crop,
      });
    }

    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true,
    });
  },

  /**
   * Get image metadata
   */
  async getImageMetadata(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        url: result.secure_url,
      };
    } catch (error) {
      console.error("Cloudinary metadata error:", error);
      throw new Error("Failed to get image metadata");
    }
  },

  /**
   * Batch upload images
   */
  async uploadMultiple(
    files: File[],
    folder: string = "ilkaii",
  ): Promise<Array<{ url: string; publicId: string }>> {
    const uploads = await Promise.all(
      files.map((file) => this.uploadImage(file, folder)),
    );
    return uploads;
  },
};
