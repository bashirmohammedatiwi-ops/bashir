/**
 * إعادة معالجة صور المنتجات — دمج PNG الشفاف على خلفية بيضاء.
 * Usage (on server): docker compose exec api npx tsx scripts/reprocess-media-white-bg.ts
 */
import * as fs from "fs/promises";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { optimizeForStorage } from "../src/modules/media/media-optimize.helper";
import { generateMediaVariants } from "../src/modules/media/media-variants.helper";

const prisma = new PrismaClient();
const mediaRoot = path.resolve(process.env.MEDIA_ROOT ?? "./uploads");

async function reprocessOne(media: {
  id: string;
  filename: string;
  storagePath: string;
  publicUrlBase: string;
}) {
  const absDir = path.join(mediaRoot, media.storagePath);
  const baseName = media.filename;
  const webpPath = path.join(absDir, `${baseName}.webp`);
  const jpgPath = path.join(absDir, `${baseName}.jpg`);

  let sourcePath = webpPath;
  try {
    await fs.access(webpPath);
  } catch {
    sourcePath = jpgPath;
    try {
      await fs.access(jpgPath);
    } catch {
      return { id: media.id, status: "skip" as const, reason: "missing files" };
    }
  }

  const buffer = await fs.readFile(sourcePath);
  const optimized = await optimizeForStorage(buffer);

  const thumbWebpPath = path.join(absDir, `${baseName}_thumb.webp`);
  const thumbAvifPath = path.join(absDir, `${baseName}_thumb.avif`);

  await Promise.all([
    fs.writeFile(webpPath, optimized.webpBuffer),
    fs.writeFile(jpgPath, optimized.jpegBuffer),
    fs.writeFile(thumbWebpPath, optimized.thumbWebpBuffer),
    optimized.thumbAvifBuffer.byteLength > 0
      ? fs.writeFile(thumbAvifPath, optimized.thumbAvifBuffer)
      : Promise.resolve(),
  ]);

  await generateMediaVariants(prisma, {
    mediaId: media.id,
    originalPath: jpgPath,
    absDir,
    baseName,
    skipThumb: true,
  });

  await prisma.media.update({
    where: { id: media.id },
    data: {
      width: optimized.width,
      height: optimized.height,
      bytes: optimized.storedBytes,
      updatedAt: new Date(),
    },
  });

  return { id: media.id, status: "ok" as const };
}

async function main() {
  const onlyProduct = process.argv.includes("--all") ? undefined : "PRODUCT";
  const list = await prisma.media.findMany({
    where: onlyProduct ? { purpose: onlyProduct as any } : {},
    select: { id: true, filename: true, storagePath: true, publicUrlBase: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`[reprocess] ${list.length} media files…`);
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const media of list) {
    try {
      const result = await reprocessOne(media);
      if (result.status === "ok") {
        ok++;
        if (ok % 25 === 0) console.log(`  … ${ok} done`);
      } else {
        skip++;
      }
    } catch (e: any) {
      fail++;
      console.warn(`  FAIL ${media.id}: ${e?.message ?? e}`);
    }
  }

  console.log(`[reprocess] complete — ok:${ok} skip:${skip} fail:${fail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
