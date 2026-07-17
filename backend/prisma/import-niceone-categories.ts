/**
 * استبدال شجرة الأقسام بالكامل بتقسيمة نايس ون (L1/L2/L3).
 *
 * - يزيل التصنيف عن كل المنتجات (يحتفظ بالمنتجات)
 * - يحذف الأقسام الحالية كلها
 * - يستورد أقسام نايس ون بالعربية والإنجليزية
 * - ينظّف روابط الأقسام في الصفحة الرئيسية والبانرات
 *
 * تشغيل:
 *   cd backend && npx tsx prisma/import-niceone-categories.ts
 *
 * إعادة الاستيراد قسرياً:
 *   FORCE_NICEONE_CATEGORY_IMPORT=1 npx tsx prisma/import-niceone-categories.ts
 */
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const MARKER_KEY = "niceone_categories_imported";

type NiceOneNode = {
  niceoneId: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  depth: number;
  position: number;
  children: NiceOneNode[];
};

type NiceOneFile = {
  source: string;
  stats: { l1: number; l2: number; l3: number };
  tree: NiceOneNode[];
};

function loadTree(): NiceOneFile {
  const candidates = [
    path.join(__dirname, "data", "niceone-categories.json"),
    path.join(process.cwd(), "prisma", "data", "niceone-categories.json"),
    path.join(process.cwd(), "data", "niceone-categories.json"),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      console.log(`    Loading ${file}`);
      return JSON.parse(fs.readFileSync(file, "utf8")) as NiceOneFile;
    }
  }
  throw new Error("niceone-categories.json not found");
}

function displayName(node: NiceOneNode): string {
  return (node.nameAr || node.nameEn || node.slug).trim();
}

function scrubHomePayload(payload: unknown): { next: unknown; changed: boolean } {
  if (!payload || typeof payload !== "object") return { next: payload, changed: false };
  const obj = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  let changed = false;

  const clearId = (key: string) => {
    if (key in obj && obj[key] != null && obj[key] !== "") {
      obj[key] = null;
      changed = true;
    }
  };

  clearId("categoryId");
  clearId("subcategoryId");
  clearId("tertiaryCategoryId");

  for (const key of ["categoryIds", "subcategoryIds", "tertiaryCategoryIds"] as const) {
    if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length) {
      obj[key] = [];
      changed = true;
    }
  }

  return { next: obj, changed };
}

async function insertNode(node: NiceOneNode, parentId: string | null): Promise<number> {
  const name = displayName(node);
  const created = await prisma.category.create({
    data: {
      name,
      nameAr: node.nameAr || name,
      nameEn: node.nameEn || null,
      slug: node.slug,
      position: node.position,
      isActive: true,
      parentId,
      description: node.nameEn && node.nameEn !== name ? node.nameEn : null,
    },
  });

  let count = 1;
  for (const child of node.children || []) {
    count += await insertNode(child, created.id);
  }
  return count;
}

async function alreadyImported(expectedTotal: number): Promise<boolean> {
  const marker = await prisma.setting.findUnique({ where: { key: MARKER_KEY } });
  if (!marker) return false;

  const total = await prisma.category.count();
  const makeup = await prisma.category.findUnique({ where: { slug: "makeup" } });
  const perfume = await prisma.category.findUnique({ where: { slug: "perfume" } });
  return Boolean(makeup && perfume && total >= expectedTotal);
}

async function run() {
  // منع تشغيل متزامن من entrypoint و update.sh
  await prisma.$executeRawUnsafe("SELECT pg_advisory_lock(87231455)");
  try {
    await runLocked();
  } finally {
    await prisma.$executeRawUnsafe("SELECT pg_advisory_unlock(87231455)");
  }
}

async function runLocked() {
  const force = process.env.FORCE_NICEONE_CATEGORY_IMPORT === "1";
  const data = loadTree();
  const expectedTotal = data.stats.l1 + data.stats.l2 + data.stats.l3;
  console.log(
    `==> Nice One categories: L1=${data.stats.l1} L2=${data.stats.l2} L3=${data.stats.l3}`,
  );

  if (!force && (await alreadyImported(expectedTotal))) {
    console.log("==> Already imported — skip (set FORCE_NICEONE_CATEGORY_IMPORT=1 to reimport)");
    return;
  }

  const productCount = await prisma.product.count();
  const oldCategoryCount = await prisma.category.count();
  console.log(`==> Current: ${productCount} products, ${oldCategoryCount} categories`);

  console.log("==> Clearing product classification...");
  const cleared = await prisma.product.updateMany({
    data: {
      categoryId: null,
      subcategoryId: null,
      tertiaryCategoryId: null,
    },
  });
  console.log(`    ${cleared.count} products uncategorized`);

  console.log("==> Deleting old categories...");
  const deleted = await prisma.category.deleteMany({});
  console.log(`    ${deleted.count} categories removed`);

  console.log("==> Importing Nice One tree...");
  let inserted = 0;
  for (const root of data.tree) {
    inserted += await insertNode(root, null);
  }
  console.log(`    ${inserted} categories created`);

  console.log("==> Scrubbing home blocks category links...");
  const blocks = await prisma.homeBlock.findMany();
  let scrubbed = 0;
  for (const block of blocks) {
    const { next, changed } = scrubHomePayload(block.payload);
    if (!changed) continue;
    await prisma.homeBlock.update({
      where: { id: block.id },
      data: { payload: next as object },
    });
    scrubbed += 1;
  }
  console.log(`    ${scrubbed} home blocks updated`);

  const banners = await prisma.banner.findMany({
    where: {
      OR: [{ linkType: "category" }, { linkType: "subcategory" }, { linkType: "tertiary" }],
    },
  });
  if (banners.length) {
    await prisma.banner.updateMany({
      where: { id: { in: banners.map((b) => b.id) } },
      data: { linkType: null, linkValue: null },
    });
    console.log(`    ${banners.length} banners unlinked from old categories`);
  }

  await prisma.setting.upsert({
    where: { key: MARKER_KEY },
    update: {
      value: {
        source: "niceone",
        importedAt: new Date().toISOString(),
        stats: data.stats,
        count: inserted,
      },
    },
    create: {
      key: MARKER_KEY,
      value: {
        source: "niceone",
        importedAt: new Date().toISOString(),
        stats: data.stats,
        count: inserted,
      },
    },
  });

  const finalCats = await prisma.category.count();
  const uncategorized = await prisma.product.count({ where: { categoryId: null } });
  const l1 = await prisma.category.count({ where: { parentId: null } });
  const l2 = await prisma.category.count({
    where: { parent: { parentId: null }, parentId: { not: null } },
  });
  const l3 = await prisma.category.count({
    where: { parent: { parent: { parentId: null } }, parentId: { not: null } },
  });

  console.log("==> Done");
  console.log(`    Categories: ${finalCats} (L1=${l1}, L2=${l2}, L3=${l3})`);
  console.log(`    Uncategorized products: ${uncategorized}`);
}

run()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
