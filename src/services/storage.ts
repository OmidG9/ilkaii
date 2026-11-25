import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getServerEnv } from "@/lib/env";
import { Errors } from "@/lib/errors";

export interface StoredImage {
  url: string;
  provider: string;
  delete(): Promise<void>;
}

function safeName(original: string) {
  const base = original.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${randomUUID()}-${base || "image"}.webp`;
}

/** Local driver writes into public/uploads (serve via reverse proxy in production). */
async function storeLocal(data: Buffer, originalName: string): Promise<StoredImage> {
  const name = safeName(originalName);
  const directory = path.join(process.cwd(), "public", "uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), data, { flag: "wx" });
  return {
    url: `/uploads/${name}`,
    provider: "local",
    async delete() {
      const { unlink } = await import("node:fs/promises");
      await unlink(path.join(directory, name)).catch(() => undefined);
    },
  };
}

async function storeCloudinary(data: Buffer, originalName: string): Promise<StoredImage> {
  const env = getServerEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw Errors.unavailable("تنظیمات Cloudinary کامل نیست");
  }
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  const publicId = safeName(originalName).replace(/\.webp$/, "");
  const result = await cloudinary.uploader.upload(`data:image/webp;base64,${data.toString("base64")}`, {
    public_id: `ilkaii/${publicId}`,
    resource_type: "image",
    folder: undefined,
  });
  return {
    url: result.secure_url,
    provider: "cloudinary",
    async delete() {
      await cloudinary.uploader.destroy(`ilkaii/${publicId}`, { resource_type: "image" }).catch(() => undefined);
    },
  };
}

export async function storeImage(data: Buffer, originalName: string): Promise<StoredImage> {
  const driver = getServerEnv().STORAGE_DRIVER;
  return driver === "CLOUDINARY" ? storeCloudinary(data, originalName) : storeLocal(data, originalName);
}
