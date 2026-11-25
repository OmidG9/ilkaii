import sharp from "sharp";
import { Errors } from "@/lib/errors";
import { storeImage } from "@/services/storage";

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_DIMENSION = 200;
const MAX_DIMENSION = 8000;

type DetectedType = "image/jpeg" | "image/png" | "image/webp";

function detectType(buffer: Buffer): DetectedType | null {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.length > 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

/**
 * Never trusts the client filename or MIME: magic bytes and actual decoding
 * decide. Images are re-encoded to WebP, stripping embedded metadata/scripts.
 */
export async function processAndStoreImage(file: File) {
  if (!file || typeof file.arrayBuffer !== "function") throw Errors.badRequest("فایلی ارسال نشده است");
  if (file.size > MAX_BYTES) throw Errors.badRequest("حجم تصویر بیش از ۵ مگابایت است");
  const original = Buffer.from(await file.arrayBuffer());
  const detected = detectType(original);
  if (!detected) throw Errors.badRequest("تنها تصاویر JPEG، PNG و WebP مجازاند");
  if (file.type && file.type !== detected) throw Errors.badRequest("نوع اعلامشده تصویر با محتوای آن مطابقت ندارد");

  let pipeline: sharp.Sharp;
  try {
    pipeline = sharp(original, { failOn: "error", limitInputPixels: 40_000_000 });
  } catch {
    throw Errors.badRequest("تصویر قابل خواندن نیست");
  }
  const metadata = await pipeline.metadata();
  if (!metadata.width || !metadata.height ||
      metadata.width < MIN_DIMENSION || metadata.height < MIN_DIMENSION ||
      metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    throw Errors.badRequest("ابعاد تصویر خارج از محدوده مجاز است");
  }
  const encoded = await sharp(original)
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();

  const stored = await storeImage(encoded, file.name || "image");
  return { url: stored.url, provider: stored.provider, width: metadata.width, height: metadata.height };
}
