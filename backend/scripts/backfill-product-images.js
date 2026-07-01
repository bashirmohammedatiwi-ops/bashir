/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Backfill placeholder product images — runs with plain Node (no tsx).
 * Usage: node scripts/backfill-product-images.js
 */
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");
const { PrismaClient, MediaPurpose } = require("@prisma/client");

const PLACEHOLDER_HASH = "alhayaa-product-placeholder-v1";

async function ensurePlaceholderMedia(prisma) {
  const existing = await prisma.media.findFirst({ where: { hash: PLACEHOLDER_HASH } });
  if (existing) return existing.id;

  const mediaRoot = path.resolve(process.env.MEDIA_ROOT ?? "./uploads");
  const subdir = "placeholder";
  const absDir = path.join(mediaRoot, subdir);
  await fs.mkdir(absDir, { recursive: true });

  const baseName = "product";
  const webpPath = path.join(absDir, `${baseName}.webp`);
  const jpgPath = path.join(absDir, `${baseName}.jpg`);

  const svg = `
    <svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="600" height="600" fill="#F3E8FF"/>
      <text x="300" y="280" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#7C3AED">Alhayaa</text>
      <text x="300" y="330" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#9CA3AF">Product</text>
    </svg>`;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  await Promise.all([
    sharp(pngBuffer).webp({ quality: 82 }).toFile(webpPath),
    sharp(pngBuffer).jpeg({ quality: 85 }).toFile(jpgPath),
  ]);

  const publicBaseUrl = `${(process.env.MEDIA_PUBLIC_BASE_URL ?? "/media").replace(/\/$/, "")}/${subdir}`;
  const stat = await fs.stat(webpPath);

  const media = await prisma.media.create({
    data: {
      purpose: MediaPurpose.PRODUCT,
      filename: baseName,
      originalName: "product-placeholder.webp",
      mime: "image/webp",
      bytes: stat.size,
      width: 600,
      height: 600,
      hash: PLACEHOLDER_HASH,
      storagePath: subdir,
      publicUrlBase: publicBaseUrl,
      variants: {
        thumb: {
          width: 320,
          formats: {
            webp: `${publicBaseUrl}/${baseName}.webp`,
            jpg: `${publicBaseUrl}/${baseName}.jpg`,
          },
        },
        small: {
          width: 480,
          formats: {
            webp: `${publicBaseUrl}/${baseName}.webp`,
            jpg: `${publicBaseUrl}/${baseName}.jpg`,
          },
        },
        medium: {
          width: 800,
          formats: {
            webp: `${publicBaseUrl}/${baseName}.webp`,
            jpg: `${publicBaseUrl}/${baseName}.jpg`,
          },
        },
        large: {
          width: 1400,
          formats: {
            webp: `${publicBaseUrl}/${baseName}.webp`,
            jpg: `${publicBaseUrl}/${baseName}.jpg`,
          },
        },
      },
    },
  });

  return media.id;
}

async function backfillProductImages(prisma) {
  const placeholderMediaId = await ensurePlaceholderMedia(prisma);
  const products = await prisma.product.findMany({
    where: { images: { none: {} } },
    select: { id: true },
  });
  if (!products.length) {
    console.log("[backfill] All products already have images.");
    return { linked: 0 };
  }

  await prisma.productImage.createMany({
    data: products.map((p) => ({
      productId: p.id,
      mediaId: placeholderMediaId,
      position: 0,
      isPrimary: true,
    })),
    skipDuplicates: true,
  });

  console.log(`[backfill] Linked placeholder image to ${products.length} products.`);
  return { linked: products.length };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await backfillProductImages(prisma);
    console.log(JSON.stringify(result));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
