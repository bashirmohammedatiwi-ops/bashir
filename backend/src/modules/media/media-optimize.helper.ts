import sharp from "sharp";

/** Max width/height for stored originals — enough for mobile detail, lean on disk. */
export const MAX_ORIGINAL_DIMENSION = Number(process.env.MEDIA_MAX_ORIGINAL_WIDTH ?? 1600);

export const COMPRESS = {
  webp: {
    quality: Number(process.env.MEDIA_WEBP_QUALITY ?? 84),
    effort: 5,
    smartSubsample: true,
  },
  jpeg: { quality: Number(process.env.MEDIA_JPEG_QUALITY ?? 85), mozjpeg: true },
} as const;

/** WebP-only variants save ~40% disk; JPEG kept for large + originals (fallback). */
export const JPEG_VARIANT_NAMES = new Set(["large"]);

function sharpInput(buffer: Buffer) {
  return sharp(buffer, { failOn: "none", unlimited: true, sequentialRead: true });
}

function fitWithinMax(width: number, height: number) {
  const maxSide = Math.max(width, height);
  if (maxSide <= MAX_ORIGINAL_DIMENSION) {
    return { width, height, resize: false };
  }
  if (width >= height) {
    return {
      width: MAX_ORIGINAL_DIMENSION,
      height: Math.round((height / width) * MAX_ORIGINAL_DIMENSION),
      resize: true,
    };
  }
  return {
    width: Math.round((width / height) * MAX_ORIGINAL_DIMENSION),
    height: MAX_ORIGINAL_DIMENSION,
    resize: true,
  };
}

export interface OptimizedImage {
  /** Primary stored file — WebP for smallest size */
  webpBuffer: Buffer;
  /** JPEG fallback for older clients */
  jpegBuffer: Buffer;
  width: number;
  height: number;
  originalBytes: number;
  storedBytes: number;
}

/**
 * Compress and resize before writing to disk.
 * Always stores WebP + JPEG originals (JPEG is the fallback).
 */
export async function optimizeForStorage(buffer: Buffer): Promise<OptimizedImage> {
  let meta: sharp.Metadata;
  try {
    meta = await sharpInput(buffer).metadata();
  } catch {
    throw new Error("UNREADABLE");
  }

  if (!meta.width || !meta.height || !meta.format) {
    throw new Error("CORRUPT");
  }

  const fit = fitWithinMax(meta.width, meta.height);
  let pipeline = sharpInput(buffer).rotate();
  if (fit.resize) {
    pipeline = pipeline.resize(fit.width, fit.height, { fit: "inside", withoutEnlargement: true });
  }

  const [webpBuffer, jpegBuffer, outMeta] = await Promise.all([
    pipeline.clone().webp(COMPRESS.webp).toBuffer(),
    pipeline.clone().jpeg(COMPRESS.jpeg).toBuffer(),
    pipeline.clone().webp(COMPRESS.webp).metadata(),
  ]);

  return {
    webpBuffer,
    jpegBuffer,
    width: outMeta.width ?? fit.width,
    height: outMeta.height ?? fit.height,
    originalBytes: buffer.byteLength,
    storedBytes: webpBuffer.byteLength + jpegBuffer.byteLength,
  };
}
