/**
 * يملأ حقول الإنجليزية تلقائياً للمحتوى العربي الحالي في HomeBlock و Banner.
 * Usage (local): npm run build && npm run backfill:cms-translations
 * On server: docker compose exec api npm run backfill:cms-translations
 */
import { PrismaClient } from "@prisma/client";
import { CmsBilingualService } from "../dist/common/cms-bilingual.service";
import { RedisCacheService } from "../dist/common/redis-cache.service";
import { TranslationService } from "../dist/common/translation.service";

const prisma = new PrismaClient();
const redis = new RedisCacheService();
const translation = new TranslationService(redis);
const cms = new CmsBilingualService(translation);

async function backfillHomeBlocks() {
  const blocks = await prisma.homeBlock.findMany({ orderBy: { position: "asc" } });
  let updated = 0;

  for (const block of blocks) {
    const enriched = await cms.enrichHomeBlockData({
      title: block.title,
      titleEn: block.titleEn,
      subtitle: block.subtitle,
      subtitleEn: block.subtitleEn,
      payload: (block.payload ?? {}) as Record<string, unknown>,
    });

    const needsUpdate =
      enriched.titleEn !== block.titleEn ||
      enriched.subtitleEn !== block.subtitleEn ||
      JSON.stringify(enriched.payload) !== JSON.stringify(block.payload);

    if (!needsUpdate) continue;

    await prisma.homeBlock.update({
      where: { id: block.id },
      data: {
        titleEn: enriched.titleEn || null,
        subtitleEn: enriched.subtitleEn || null,
        payload: enriched.payload as object,
      },
    });
    updated++;
    console.log(`  HomeBlock ${block.id} (${block.type})`);
  }

  return { total: blocks.length, updated };
}

async function backfillBanners() {
  const banners = await prisma.banner.findMany({ orderBy: { position: "asc" } });
  let updated = 0;

  for (const banner of banners) {
    const enriched = await cms.enrichBannerData({ ...banner });
    const patch: Record<string, unknown> = {};
    for (const field of ["title", "subtitle", "tag", "ctaLabel", "discountText"] as const) {
      const enKey = `${field}En`;
      if (enriched[enKey] && enriched[enKey] !== (banner as Record<string, unknown>)[enKey]) {
        patch[enKey] = enriched[enKey];
      }
    }
    if (!Object.keys(patch).length) continue;

    await prisma.banner.update({ where: { id: banner.id }, data: patch });
    updated++;
    console.log(`  Banner ${banner.id}`);
  }

  return { total: banners.length, updated };
}

async function main() {
  console.log("Backfilling CMS English translations…");
  const hasDeepL = Boolean(process.env.DEEPL_API_KEY?.trim());
  const hasGoogle = Boolean(process.env.GOOGLE_TRANSLATE_API_KEY?.trim());
  console.log(
    `Translation API: ${hasDeepL ? "DeepL" : hasGoogle ? "Google" : "glossary + MyMemory (fallback)"}`,
  );

  const blocks = await backfillHomeBlocks();
  console.log(`HomeBlocks: ${blocks.updated}/${blocks.total} updated`);

  const banners = await backfillBanners();
  console.log(`Banners: ${banners.updated}/${banners.total} updated`);

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await redis.onModuleDestroy();
  });
