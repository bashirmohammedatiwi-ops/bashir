import { PrismaClient } from "@prisma/client";

/**
 * إزالة الصور المكررة من معرض كل منتج (نفس mediaId أو نفس hash).
 * التشغيل: npx tsx backend/prisma/scripts/dedupe-product-images.ts
 */
export async function dedupeProductImagesScript(prisma: PrismaClient) {
  const products = await prisma.product.findMany({ select: { id: true } });
  let removed = 0;
  let productsAffected = 0;

  for (const { id: productId } of products) {
    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { position: "asc" },
      include: { media: { select: { hash: true } } },
    });
    if (images.length <= 1) continue;

    const seenMedia = new Set<string>();
    const seenHash = new Set<string>();
    const keep: typeof images = [];
    const removeIds: string[] = [];

    for (const img of images) {
      const hash = img.media.hash;
      if (seenMedia.has(img.mediaId) || seenHash.has(hash)) {
        removeIds.push(img.id);
        continue;
      }
      seenMedia.add(img.mediaId);
      seenHash.add(hash);
      keep.push(img);
    }

    if (!removeIds.length) continue;

    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { id: { in: removeIds } } });
      for (let i = 0; i < keep.length; i++) {
        await tx.productImage.update({
          where: { id: keep[i].id },
          data: { position: i, isPrimary: i === 0 },
        });
      }
    });

    removed += removeIds.length;
    productsAffected += 1;
  }

  console.log(`[dedupe] Removed ${removed} duplicate image(s) across ${productsAffected} product(s).`);
  return { removed, productsAffected };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  dedupeProductImagesScript(prisma)
    .then((r) => console.log(JSON.stringify(r)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
