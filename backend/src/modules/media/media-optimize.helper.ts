import sharp from "sharp";

/**
 * Max side for stored originals.
 * 2400px keeps product detail sharp on mobile / admin zoom.
 */
export const MAX_ORIGINAL_DIMENSION = Number(process.env.MEDIA_MAX_ORIGINAL_WIDTH ?? 2400);

/**
 * Compression tuned for product photography (sharp edges, text on packaging).
 */
export const COMPRESS = {
  webp: {
    quality: Number(process.env.MEDIA_WEBP_QUALITY ?? 90),
    effort: 5,
    smartSubsample: false,
  },
  /** AVIF: slightly higher quality — packaging photos suffer at very low q */
  avif: {
    quality: Number(process.env.MEDIA_AVIF_QUALITY ?? 62),
    effort: 4,
    chromaSubsampling: "4:2:0" as const,
  },
  jpeg: {
    quality: Number(process.env.MEDIA_JPEG_QUALITY ?? 90),
    mozjpeg: true,
  },
} as const;

/** JPEG kept only for large + originals (fallback for rare clients). */
export const JPEG_VARIANT_NAMES = new Set(["large"]);

/** AVIF for list/detail sizes — biggest win for mobile bandwidth. */
export const AVIF_VARIANT_NAMES = new Set(["thumb", "small", "medium", "large"]);

/** خلفية منتجات — PNG الشفاف يُدمج عليها (بدلاً من الأسود الافتراضي في sharp). */
export const PRODUCT_IMAGE_BACKGROUND = { r: 255, g: 255, b: 255 } as const;

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

/** يدمج قناة الشفافية على أبيض — يمنع الخلفية السوداء في JPEG/WebP. */
export async function flattenAlphaToWhite(pipeline: sharp.Sharp): Promise<sharp.Sharp> {
  const meta = await pipeline.clone().metadata();
  if (meta.hasAlpha) {
    return pipeline.flatten({ background: PRODUCT_IMAGE_BACKGROUND });
  }
  return pipeline;
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

  pipeline = await flattenAlphaToWhite(pipeline);

  const thumbPipeline = pipeline.clone().resize({
    width: 320,
    withoutEnlargement: true,
    fit: "inside",
    kernel: sharp.kernel.lanczos3,
  });

  const [webpBuffer, jpegBuffer, thumbWebpBuffer, thumbAvifBuffer, outMeta] = await Promise.all([
    pipeline.clone().webp(COMPRESS.webp).toBuffer(),
    pipeline.clone().jpeg(COMPRESS.jpeg).toBuffer(),
    thumbPipeline.clone().webp({ ...COMPRESS.webp, quality: 85 }).toBuffer(),
    thumbPipeline.clone().avif({ ...COMPRESS.avif, quality: 55 }).toBuffer().catch(() => Buffer.alloc(0)),
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
