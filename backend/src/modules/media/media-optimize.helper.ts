import sharp from "sharp";

/**
 * Max side for stored originals.
 * 1800px is enough for mobile zoom / detail while keeping disk lean.
 */
export const MAX_ORIGINAL_DIMENSION = Number(process.env.MEDIA_MAX_ORIGINAL_WIDTH ?? 1800);

/**
 * Compression tuned for high perceived quality at low bytes.
 * AVIF for delivery sizes; WebP + JPEG originals for universal fallback.
 */
export const COMPRESS = {
  webp: {
    quality: Number(process.env.MEDIA_WEBP_QUALITY ?? 82),
    effort: 6,
    smartSubsample: true,
  },
  /** AVIF: ~30–50% smaller than WebP at similar visual quality */
  avif: {
    quality: Number(process.env.MEDIA_AVIF_QUALITY ?? 52),
    effort: 4,
    chromaSubsampling: "4:2:0" as const,
  },
  jpeg: {
    quality: Number(process.env.MEDIA_JPEG_QUALITY ?? 84),
    mozjpeg: true,
  },
} as const;

/** JPEG kept only for large + originals (fallback for rare clients). */
export const JPEG_VARIANT_NAMES = new Set(["large"]);

/** AVIF for list/detail sizes — biggest win for mobile bandwidth. */
export const AVIF_VARIANT_NAMES = new Set(["thumb", "small", "medium", "large"]);

function sharpInput(buffer: Buffer) {
  return sharp(buffer, {
    failOn: "none",
    unlimited: true,
    sequentialRead: true,
    // HEIC/HEIF from iPhone camera rolls when libvips supports it
    animated: false,
  });
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
  webpBuffer: Buffer;
  jpegBuffer: Buffer;
  /** Tiny preview written synchronously so admin UI never hits a missing variant */
  thumbWebpBuffer: Buffer;
  thumbAvifBuffer: Buffer;
  width: number;
  height: number;
  originalBytes: number;
  storedBytes: number;
}

/**
 * Compress and resize before writing to disk.
 * Always stores WebP + JPEG originals; also prepares a 240px thumb for immediate display.
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
    pipeline = pipeline.resize(fit.width, fit.height, {
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  const thumbPipeline = pipeline.clone().resize({
    width: 240,
    withoutEnlargement: true,
    fit: "inside",
    kernel: sharp.kernel.lanczos3,
  });

  const [webpBuffer, jpegBuffer, thumbWebpBuffer, thumbAvifBuffer, outMeta] = await Promise.all([
    pipeline.clone().webp(COMPRESS.webp).toBuffer(),
    pipeline.clone().jpeg(COMPRESS.jpeg).toBuffer(),
    thumbPipeline.clone().webp({ ...COMPRESS.webp, quality: 78 }).toBuffer(),
    thumbPipeline.clone().avif({ ...COMPRESS.avif, quality: 48 }).toBuffer().catch(() => Buffer.alloc(0)),
    pipeline.clone().webp(COMPRESS.webp).metadata(),
  ]);

  return {
    webpBuffer,
    jpegBuffer,
    thumbWebpBuffer,
    thumbAvifBuffer,
    width: outMeta.width ?? fit.width,
    height: outMeta.height ?? fit.height,
    originalBytes: buffer.byteLength,
    storedBytes: webpBuffer.byteLength + jpegBuffer.byteLength + thumbWebpBuffer.byteLength,
  };
}
