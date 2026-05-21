import sharp from "sharp";
import * as path from "path";
import { PrismaService } from "../../common/prisma.service";
import { IMAGE_VARIANTS, VariantsRecord } from "./media.constants";
import { COMPRESS } from "./media-optimize.helper";

export interface GenerateVariantsInput {
  mediaId: string;
  originalPath: string;
  absDir: string;
  baseName: string;
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
    const jpgPath = path.join(absDir, `${baseName}_${v.name}.jpg`);

    // WebP first (smaller) — mobile/admin prefer this
    await resized
      .clone()
      .webp({ ...COMPRESS.webp, quality: Math.min(COMPRESS.webp.quality, v.width <= 200 ? 72 : 78) })
      .toFile(webpPath);

    await resized.clone().jpeg({ ...COMPRESS.jpeg, quality: v.width <= 200 ? 78 : 82 }).toFile(jpgPath);

    variants[v.name] = {
      width: v.width,
      formats: {
        webp: `${media.publicUrlBase}/${baseName}_${v.name}.webp`,
        jpg: `${media.publicUrlBase}/${baseName}_${v.name}.jpg`,
      },
    };
  }

  await prisma.media.update({
    where: { id: mediaId },
    data: { variants: variants as any },
  });
}
