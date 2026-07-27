/**
 * يجلب المنتجات من API ويولّد ملف الربط لدليل البشرة.
 * Usage: npx tsx scripts/generate-skin-concern-assignments.ts [API_BASE]
 */
const API_BASE = (process.argv[2] ?? "https://deemaalhayat.com/api/v1").replace(/\/$/, "");

const PRODUCTS_PER_CONCERN = 8;

type ConcernSlug = "acne" | "pigmentation" | "dryness" | "sensitivity";

type ProductLite = {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  tags?: string | string[];
  soldCount?: number;
  stock?: number;
  brand?: { name?: string };
  category?: { name?: string; slug?: string };
};

type ConcernRule = {
  slug: ConcernSlug;
  keywords: RegExp[];
  strongKeywords: RegExp[];
  negative: RegExp[];
};

const RULES: ConcernRule[] = [
  {
    slug: "acne",
    strongKeywords: [
      /حب\s*الشباب|حب\s*شباب|anti[\s-]?acne|acne|blemish|breakout|salicylic|ساليسيليك|benzoyl|بيروكسيد|peroxide|effaclar|إيفاكلار|sebium|سيبيوم|purifying|تنقية|clarifying|anti[\s-]?spot|spot\s*treatment|pore|مسام|sebum|زهم|mattifying|matte|oil[\s-]?free|خالي\s*من\s*الزيوت/i,
    ],
    keywords: [
      /niacinamide|نياسيناميد|zinc|زنك|tea\s*tree|clay|طين|AHA|BHA|glycolic|جلايكوليك|lactic|لاكتيك|exfoliat|تقشير|blackhead|whitehead|comedon/i,
    ],
    negative: [
      /عطر|perfume|eau\s*de|fragrance\s*mist|mascara|lipstick|أحمر\s*شفاه|foundation|كريم\s*أساس|eyeliner|nail|مناكير|blush|bronzer|highlighter|lip\s*gloss|brow\s*pencil|retinol|ريتينول|tranexamic|ترانيكساميك|cicalfate|سيكالفات|depiwhite|ديپي|تفتيح|brightening|whitening/i,
    ],
  },
  {
    slug: "pigmentation",
    strongKeywords: [
      /تصبغ|تفتيح|brightening|whitening|dark\s*spot|sun\s*spot|melasma|hyperpigmentation|even\s*tone|موحد|luminous|glow|vitamin\s*c|فيتامين\s*سي|vit\s*c|ascorbic|kojic|كوجيك|arbutin|أربوتين|depiwhite|ديپي|niacinamide|نياسيناميد|tranexamic|ترانيكساميك|alpha[\s-]?arbutin|C\s*20|C15|C10/i,
    ],
    keywords: [
      /SPF|sunscreen|واقي|حماية\s*من\s*الشمس|antioxidant|مضاد\s*أكسدة|radiance|إشراق|clarify|تفتيح\s*البشرة|pigment|بقع/i,
    ],
    negative: [
      /عطر|perfume|eau\s*de|mascara|lipstick|أحمر\s*شفاه|foundation|كريم\s*أساس|eyeliner|nail|مناكير|deodorant|مزيل\s*عرق/i,
    ],
  },
  {
    slug: "dryness",
    strongKeywords: [
      /جفاف|ترطيب|hydrat|moistur|مرطب|hyaluronic|هيالورونيك|ceramide|سيراميد|nourish|غذاء|dry\s*skin|بشرة\s*جافة|barrier|حاجز|aqua|water\s*cream|rich\s*cream|كريم\s*غني|intense|مكثف|repair|إصلاح|shea|شيا|squalane|سكوالان|glycerin|جليسرين|emollient/i,
    ],
    keywords: [
      /serum|سيروم|lotion|لوشن|balm|بلسم|mask|ماسك|night\s*cream|ليل|body\s*lotion|جسم|lip\s*care|شفاه/i,
    ],
    negative: [
      /عطر|perfume|eau\s*de|mascara|lipstick|أحمر\s*شفاه|foundation|كريم\s*أساس|eyeliner|nail|مناكير|matte\s*lip|setting\s*spray/i,
    ],
  },
  {
    slug: "sensitivity",
    strongKeywords: [
      /حساس|sensitive|soothing|مهدئ|calm|comfort|relief|لطيف|gentle|fragrance[\s-]?free|خالي\s*من\s*العطر|hypoallergenic|redness|احمرار|irritat|تهيج|centella|سنتيلا|cica|aloe|ألو|chamomile|بابونج|toleriane|تولريان|sensibio|سينسيبيو|atoderm|أتوديرم|repair|إصلاح|barrier|حاجز|derm|derma|micellar|ميسيلار/i,
    ],
    keywords: [
      /minimal|بسيط|clean|نظيف|panthenol|بانثينول|allantoin|madecassoside|thermal\s*water|مياه\s*حرارية/i,
    ],
    negative: [
      /عطر|perfume|eau\s*de|retinol|ريتينول|AHA|BHA|glycolic|acid|حمض|peel|تقشير\s*قوي|mascara|lipstick|أحمر\s*شفاه|foundation|كريم\s*أساس|cleansance|كلينانس|anti[\s-]?acne|acne|حب\s*شباب|حبوب|effaclar|إيفاكلار|sebium|سيبيوم/i,
    ],
  },
];

const SKINCARE_SLUGS = new Set(["care", "skincare", "face", "body", "vitamins-supplements"]);

function productText(p: ProductLite): string {
  const tags = Array.isArray(p.tags) ? p.tags.join(" ") : String(p.tags ?? "");
  return [p.name, p.nameAr, p.nameEn, p.description, tags, p.brand?.name, p.category?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isSkincare(p: ProductLite): boolean {
  const slug = p.category?.slug?.toLowerCase() ?? "";
  const name = p.category?.name?.toLowerCase() ?? "";
  if (SKINCARE_SLUGS.has(slug)) return true;
  if (/عناية|بشرة|care|skin|face|جسم|body|vitamin/i.test(name)) return true;
  const text = productText(p);
  return /cream|serum|lotion|gel|moistur|hydrat|sunscreen|واقي|كريم|سيروم|غسول|cleanser|toner|تونر|مرطب|ترطيب/i.test(text);
}

function scoreProduct(p: ProductLite, rule: ConcernRule): number {
  const text = productText(p);
  if (!text.trim()) return -1;
  for (const neg of rule.negative) {
    if (neg.test(text)) return -1;
  }
  let score = 0;
  for (const rx of rule.strongKeywords) if (rx.test(text)) score += 12;
  for (const rx of rule.keywords) if (rx.test(text)) score += 4;
  if (isSkincare(p)) score += 3;
  if ((p.stock ?? 0) > 0) score += 2;
  score += Math.min((p.soldCount ?? 0) / 50, 5);
  return score;
}

async function fetchAllProducts(): Promise<ProductLite[]> {
  const all: ProductLite[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext) {
    const res = await fetch(`${API_BASE}/products?limit=100&page=${page}&lite=1`);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching products page ${page}`);
    const body = (await res.json()) as { data?: ProductLite[]; meta?: { hasNext?: boolean } };
    const items = body.data ?? [];
    all.push(...items);
    hasNext = Boolean(body.meta?.hasNext) && items.length > 0;
    page++;
    if (page > 50) break;
  }
  return all;
}

function pick(products: ProductLite[], rule: ConcernRule, used: Set<string>) {
  const ranked = products
    .map((p) => ({ p, score: scoreProduct(p, rule) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.p.soldCount ?? 0) - (a.p.soldCount ?? 0));

  const picked: ProductLite[] = [];
  for (const { p } of ranked) {
    if (picked.length >= PRODUCTS_PER_CONCERN) break;
    if (used.has(p.id)) continue;
    picked.push(p);
    used.add(p.id);
  }
  if (picked.length < PRODUCTS_PER_CONCERN) {
    for (const p of products.filter((x) => isSkincare(x) && !used.has(x.id) && (x.stock ?? 0) > 0).sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))) {
      if (picked.length >= PRODUCTS_PER_CONCERN) break;
      picked.push(p);
      used.add(p.id);
    }
  }
  return picked;
}

async function main() {
  const concernsRes = await fetch(`${API_BASE}/skin-concerns?all=1`);
  const concernsBody = (await concernsRes.json()) as {
    data?: { id: string; slug: string; name: string }[];
  };
  const concerns = concernsBody.data ?? [];
  const bySlug = new Map(concerns.map((c) => [c.slug, c]));

  console.log(`Fetching products from ${API_BASE}...`);
  const products = await fetchAllProducts();
  console.log(`Loaded ${products.length} products.`);

  const used = new Set<string>();
  const assignments: Record<string, { concernId: string; concernSlug: string; concernName: string; products: { id: string; name: string }[] }> = {};

  for (const rule of RULES) {
    const concern = bySlug.get(rule.slug);
    if (!concern) {
      console.error(`Missing concern: ${rule.slug}`);
      process.exit(1);
    }
    const picked = pick(products, rule, used);
    assignments[rule.slug] = {
      concernId: concern.id,
      concernSlug: rule.slug,
      concernName: concern.name,
      products: picked.map((p) => ({
        id: p.id,
        name: p.nameAr || p.name || p.nameEn || p.id,
      })),
    };
    console.log(`\n${concern.name} (${rule.slug}): ${picked.length}`);
    for (const p of picked) console.log(`  · ${p.nameAr || p.name || p.nameEn}`);
  }

  const fs = await import("fs/promises");
  const path = await import("path");
  const outPath = path.join(__dirname, "skin-concern-assignments.json");
  await fs.writeFile(outPath, JSON.stringify(assignments, null, 2), "utf8");
  console.log(`\nSaved ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
