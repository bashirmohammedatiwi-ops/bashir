/**
 * يطبّق ربط دليل البشرة من skin-concern-assignments.json (أو يحسبه تلقائياً).
 * Usage (server): docker compose exec api npm run link:skin-concerns
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { HomeFeedCacheService } from "../dist/common/home-feed-cache.service";
import { RedisCacheService } from "../dist/common/redis-cache.service";

const prisma = new PrismaClient();
const redis = new RedisCacheService();
const homeFeedCache = new HomeFeedCacheService(redis);
const ASSIGNMENTS_FILE = join(__dirname, "skin-concern-assignments.json");

type AssignmentFile = Record<
  string,
  {
    concernId: string;
    concernSlug: string;
    concernName: string;
    products: { id: string; name: string }[];
  }
>;

async function applyAssignments(assignments: AssignmentFile) {
  const productToConcerns = new Map<string, Set<string>>();

  for (const entry of Object.values(assignments)) {
    console.log(`\n${entry.concernName} (${entry.concernSlug}) — ${entry.products.length} products:`);
    for (const p of entry.products) {
      console.log(`  · ${p.name}`);
      if (!productToConcerns.has(p.id)) productToConcerns.set(p.id, new Set());
      productToConcerns.get(p.id)!.add(entry.concernId);
    }
  }

  const affectedIds = [...productToConcerns.keys()];
  if (!affectedIds.length) {
    console.log("No products to link.");
    return;
  }

  const existing = await prisma.productSkinConcern.findMany({
    where: { productId: { in: affectedIds } },
    select: { productId: true, concernId: true },
  });
  for (const row of existing) {
    productToConcerns.get(row.productId)?.add(row.concernId);
  }

  let linksCreated = 0;
  await prisma.$transaction(async (tx) => {
    for (const productId of affectedIds) {
      const concernIds = [...(productToConcerns.get(productId) ?? [])];
      await tx.productSkinConcern.deleteMany({ where: { productId } });
      if (!concernIds.length) continue;
      const result = await tx.productSkinConcern.createMany({
        data: concernIds.map((concernId) => ({ productId, concernId })),
        skipDuplicates: true,
      });
      linksCreated += result.count;
    }
  });

  console.log(`\nDone. ${linksCreated} links saved for ${affectedIds.length} products.`);
}

async function main() {
  if (!existsSync(ASSIGNMENTS_FILE)) {
    console.error(`Missing ${ASSIGNMENTS_FILE} — run: npx tsx scripts/generate-skin-concern-assignments.ts`);
    process.exit(1);
  }

  const raw = readFileSync(ASSIGNMENTS_FILE, "utf8");
  const assignments = JSON.parse(raw) as AssignmentFile;

  const concernIds = new Set(Object.values(assignments).map((a) => a.concernId));
  const found = await prisma.skinConcern.count({ where: { id: { in: [...concernIds] } } });
  if (found !== concernIds.size) {
    console.error("Some concern IDs in JSON not found in database — regenerate assignments on this server.");
    process.exit(1);
  }

  const productIds = Object.values(assignments).flatMap((a) => a.products.map((p) => p.id));
  const foundProducts = await prisma.product.count({
    where: { id: { in: productIds }, isActive: true },
  });
  if (foundProducts < productIds.length) {
    console.warn(`WARN: ${productIds.length - foundProducts} products missing or inactive — continuing.`);
  }

  await applyAssignments(assignments);
  await homeFeedCache.invalidateAll();
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
