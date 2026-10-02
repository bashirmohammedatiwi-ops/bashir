/**
 * يملأ Product.searchText (المستند المعجمي المُطبَّع) لكل المنتجات النشطة.
 * Usage: npx tsx scripts/assistant-backfill-searchtext.ts
 * On server: docker compose exec api npx tsx scripts/assistant-backfill-searchtext.ts
 */
import { PrismaClient } from "@prisma/client";
import { buildSearchText } from "../src/modules/assistant/retrieval/search-document";

const prisma = new PrismaClient();
const BATCH = 200;

const include = {
  brand: { select: { name: true } },
  category: { select: { name: true, nameAr: true } },
  subcategory: { select: { name: true, nameAr: true } },
  tertiaryCategory: { select: { name: true, nameAr: true } },
  subcategories: { select: { name: true, nameAr: true } },
  tertiaryCategories: { select: { name: true, nameAr: true } },
  shades: { select: { name: true } },
  variants: { select: { label: true, sizeLabel: true } },
} as const;

async function main() {
  const total = await prisma.product.count();
  console.log(`Backfilling searchText for ${total} products…`);

  let cursor: string | undefined;
  let updated = 0;

  for (;;) {
    const products = await prisma.product.findMany({
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      include,
    });
    if (!products.length) break;
    cursor = products[products.length - 1].id;

    await prisma.$transaction(
      products.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: { searchText: buildSearchText(p) },
          select: { id: true },
        }),
      ),
    );
    updated += products.length;
    process.stdout.write(`\r${updated}/${total}`);
  }

  console.log(`\nDone. Updated ${updated} products.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
