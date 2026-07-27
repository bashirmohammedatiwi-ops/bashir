import { PrismaClient } from "@prisma/client";
import {
  partitionDuplicateProductImages,
  type MediaForDedupe,
} from "../../src/modules/catalog/product-image-dedupe.util";

const MEDIA_SELECT = {
  id: true,
  hash: true,
  filename: true,
  storagePath: true,
  publicUrlBase: true,
  originalName: true,
  width: true,
  height: true,
  bytes: true,
} as const;

/**
 * إزالة الصور المكررة من معرض كل منتج.
 * يطابق: نفس mediaId، hash، مسار التخزين، رابط العرض، أو اسم الملف الأصلي.
 *
 * التشغيل:
 *   npx tsx prisma/scripts/dedupe-product-images.ts
 *   npx tsx prisma/scripts/dedupe-product-images.ts --scan
 */
export async function dedupeProductImagesScript(prisma: PrismaClient, opts: { scanOnly?: boolean } = {}) {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, sku: true },
    orderBy: { updatedAt: "desc" },
  });

  let removed = 0;
  let productsAffected = 0;
  const samples: { productId: string; name: string; sku: string | null; duplicates: number }[] = [];

  for (const product of products) {
    const images = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { position: "asc" },
      include: { media: { select: MEDIA_SELECT } },
    });
    if (images.length <= 1) continue;

    const { keep, removeIds } = partitionDuplicateProductImages(
      images.map((img) => ({
        id: img.id,
        mediaId: img.mediaId,
        media: img.media as MediaForDedupe,
      })),
    );

    if (!removeIds.length) continue;

    productsAffected += 1;
    removed += removeIds.length;

    if (opts.scanOnly) {
      samples.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        duplicates: removeIds.length,
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { id: { in: removeIds } } });
      for (let i = 0; i < keep.length; i++) {
        await tx.productImage.update({
          where: { id: keep[i].id },
          data: { position: i, isPrimary: i === 0 },
        });
      }
    });
  }

  const summary = { removed, productsAffected, samples: samples.slice(0, 30) };
  if (opts.scanOnly) {
    console.log(`[dedupe:scan] Found ${removed} duplicate image(s) across ${productsAffected} product(s).`);
  } else {
    console.log(`[dedupe] Removed ${removed} duplicate image(s) across ${productsAffected} product(s).`);
  }
  return summary;
}

if (require.main === module) {
  const scanOnly = process.argv.includes("--scan");
  const prisma = new PrismaClient();
  dedupeProductImagesScript(prisma, { scanOnly })
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
