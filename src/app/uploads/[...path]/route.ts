import { readFile } from "node:fs/promises";
import path from "node:path";
import { localUploadDirectory } from "@/services/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
};

type Context = { params: Promise<{ path: string[] }> };

/**
 * Serves local uploads from LOCAL_UPLOAD_DIR so a production deployment can use
 * a persistent volume outside the (read-only) build/public directory. In
 * serverless environments use Cloudinary instead.
 */
export async function GET(_request: Request, context: Context) {
  const segments = (await context.params).path ?? [];
  if (!segments.length || segments.some((segment) => !segment || segment === "." || segment === ".." || /[\\/]/.test(segment))) {
    return new Response("Invalid path", { status: 400 });
  }

  const directory = localUploadDirectory();
  const filePath = path.resolve(directory, ...segments);
  const relative = path.relative(directory, filePath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return new Response("Invalid path", { status: 400 });
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(filePath);
    return new Response(data, {
      headers: {
        "content-type": contentType,
        "content-length": String(data.byteLength),
        "cache-control": "public, max-age=31536000, immutable",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
