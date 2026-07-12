import sharp from "sharp";
import * as path from "path";
import { PrismaService } from "../../common/prisma.service";
import { IMAGE_VARIANTS, VariantsRecord } from "./media.constants";
import { COMPRESS, JPEG_VARIANT_NAMES } from "./media-optimize.helper";

export interface GenerateVariantsInput {
  mediaId: string;
  originalPath: string;
  absDir: string;
  baseName: string;
}

function webpQualityForWidth(width: number): number {
  if (width <= 240) return 76;
  if (width <= 480) return 80;
  if (width <= 800) return 82;
  return COMPRESS.webp.quality;
}

export async function generateMediaVariants(
  prisma: PrismaService,
  input: GenerateVariantsInput,
): Promise<void> {
  const { mediaId, originalPath, absDir, baseName } = input;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return;

  const variants: Partial<VariantsRecord> = {};
  const original = sharp(originalPath, {
    failOn: "none",
    unlimited: true,
    sequentialRead: true,
  }).rotate();

  for (const v of IMAGE_VARIANTS) {
    const resized = original.clone().resize({
      width: v.width,
      withoutEnlargement: true,
      fit: "inside",
    });
    const webpPath = path.join(absDir, `${baseName}_${v.name}.webp`);
    const webpQ = webpQualityForWidth(v.width);

    await resized
      .clone()
      .webp({ ...COMPRESS.webp, quality: webpQ })
      .toFile(webpPath);

    const formats: Record<string, string> = {
      webp: `${media.publicUrlBase}/${baseName}_${v.name}.webp`,
    };

    if (JPEG_VARIANT_NAMES.has(v.name)) {
      const jpgPath = path.join(absDir, `${baseName}_${v.name}.jpg`);
      await resized.clone().jpeg(COMPRESS.jpeg).toFile(jpgPath);
      formats.jpg = `${media.publicUrlBase}/${baseName}_${v.name}.jpg`;
    }

    variants[v.name] = {
      width: v.width,
      formats,
    };
  }

  await prisma.media.update({
    where: { id: mediaId },
    data: { variants: variants as any },
  });
}
