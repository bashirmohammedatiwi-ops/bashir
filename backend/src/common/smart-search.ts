import { Prisma, PrismaClient } from "@prisma/client";

const NORM_FROM = "أإآىةؤئ";
const NORM_TO = "ااايهوي";

/** تطبيع عربي/إنجليزي حتى يطابق البحث بغض النظر عن لغة الواجهة. */
export function normalizeSearchText(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYNONYM_GROUPS = [
  ["lipstick", "lip stick", "روج", "احمر شفاه", "احمر الشفاه", "lip color"],
  ["lip gloss", "gloss", "ملمع", "ملمع شفاه", "lipgloss"],
  ["lip liner", "محدد شفاه", "محدد الشفاه"],
  ["lip balm", "مرطب شفاه", "balm"],
  ["mascara", "ماسكارا", "مسكارا"],
  ["eyeliner", "kajal", "kohl", "كحل", "كحله"],
  ["eyeshadow", "eye shadow", "ايشادو", "ظلال", "ظل عيون"],
  ["foundation", "فاونديشن", "كريم اساس", "base"],
  ["concealer", "كونسيلر", "corrector"],
  ["blush", "بلاشر", "rouge", "خدود"],
  ["highlighter", "هايلايتر", "glow"],
  ["contour", "كونتور", "bronzer", "برونزر"],
  ["powder", "بودره", "بودرة", "setting powder"],
  ["primer", "برايمر", "base primer"],
  ["shampoo", "شامبو"],
  ["conditioner", "بلسم", "conditioning"],
  ["serum", "سيروم"],
  ["sunscreen", "spf", "sun block", "واقي شمس", "واقي", "sun screen"],
  ["cream", "كريم"],
  ["lotion", "لوشن"],
  ["moisturizer", "moisturiser", "مرطب", "ترطيب"],
  ["perfume", "fragrance", "parfum", "eau de parfum", "عطر", "عطور"],
  ["oud", "عود", "bakhoor"],
  ["musk", "مسك"],
  ["nail", "nails", "اظافر", "طلاء", "nail polish", "manicure"],
  ["lens", "lenses", "عدسات", "عدسه", "contact lens"],
  ["gift", "gifts", "هدايا", "هديه", "set", "مجموعه"],
  ["makeup", "make up", "مكياج", "cosmetics"],
  ["skincare", "skin care", "عناية", "عنايه", "skin"],
  ["hair", "شعر", "haircare", "hair care"],
  ["body", "جسم", "bodycare", "body care"],
  ["eye", "eyes", "عين", "عيون"],
  ["lip", "lips", "شفه", "شفاه", "شفايف"],
  ["mask", "ماسك", "face mask"],
  ["cleanser", "غسول", "wash", "cleaning"],
  ["oil", "زيت", "argan", "argan oil"],
  ["brush", "فرشاه", "فرشاة", "sponge", "beauty blender"],
  ["toner", "تونر"],
  ["exfoliator", "scrub", "مقشر", "peeling"],
  ["deodorant", "مزيل عرق", "antiperspirant"],
  ["soap", "صابون"],
  ["baby", "اطفال", "طفل", "kids"],
  ["men", "رجال", "للرجال", "his"],
  ["vitamin c", "vit c", "فيتامين سي"],
  ["retinol", "retinal", "ريتينول"],
  ["hyaluronic", "hyaluron", "هيالورون"],
  ["collagen", "كولاجين"],
  ["keratin", "كيراتين"],
  ["paraben free", "خالي من البارaben"],
];

const TERM_TO_GROUP = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) {
  const normalized = [...new Set(group.map(normalizeSearchText).filter(Boolean))];
  for (const term of normalized) TERM_TO_GROUP.set(term, normalized);
}

export function expandSearchTerms(raw: string): string[] {
  const normalized = normalizeSearchText(raw);
  const out = new Set<string>();
  if (normalized) out.add(normalized);
  const group = TERM_TO_GROUP.get(normalized);
  if (group) for (const term of group) out.add(term);
  for (const token of normalized.split(" ").filter((t) => t.length >= 2)) {
    const g = TERM_TO_GROUP.get(token);
    if (g) for (const term of g) out.add(term);
  }
  return [...out].filter((term) => term.length >= 2).slice(0, 12);
}

function rawTokens(raw: string): string[] {
  const normalized = normalizeSearchText(raw);
  const split = normalized.split(" ").map((token) => token.trim()).filter((token) => token.length >= 2);
  if (split.length) return split.slice(0, 8);
  return normalized.length >= 2 ? [normalized] : [];
}

function likePattern(token: string): string {
  return `%${token.replace(/[\\%_]/g, "\\$&")}%`;
}

function startsPattern(token: string): string {
  return `${token.replace(/[\\%_]/g, "\\$&")}%`;
}

function normalizedExpr(expr: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`regexp_replace(translate(lower(${expr}), ${NORM_FROM}, ${NORM_TO}), '[ً-ْٰـ]', '', 'g')`;
}

function productNameExpr(): Prisma.Sql {
  return normalizedExpr(
    Prisma.sql`coalesce(p.name,'') || ' ' || coalesce(p."nameAr",'') || ' ' || coalesce(p."nameEn",'')`,
  );
}

function productSearchBlob(): Prisma.Sql {
  return normalizedExpr(
    Prisma.sql`coalesce(p.name,'') || ' ' || coalesce(p."nameAr",'') || ' ' || coalesce(p."nameEn",'') || ' ' || coalesce(p.tags,'') || ' ' || coalesce(p.sku,'') || ' ' || coalesce(p.barcode,'') || ' ' || coalesce(p.slug,'') || ' ' || coalesce(p.description,'') || ' ' || coalesce(p."descriptionAr",'') || ' ' || coalesce(p."descriptionEn",'')`,
  );
}

function brandExpr(): Prisma.Sql {
  return normalizedExpr(Prisma.sql`coalesce(b.name,'')`);
}

function categoryExpr(): Prisma.Sql {
  return normalizedExpr(
    Prisma.sql`coalesce(c.name,'') || ' ' || coalesce(c."nameAr",'') || ' ' || coalesce(c."nameEn",'')`,
  );
}

function assistantTagExpr(): Prisma.Sql {
  return normalizedExpr(
    Prisma.sql`coalesce(apt.summary,'') || ' ' || coalesce(array_to_string(apt.concerns, ' '), '') || ' ' || coalesce(apt.kind,'') || ' ' || coalesce(apt.area,'')`,
  );
}

/** هل يطابق المصطلح أي حقل قابل للبحث؟ */
function termMatchClause(pattern: string): Prisma.Sql {
  const shadeText = normalizedExpr(Prisma.sql`s.name`);
  return Prisma.sql`(
    ${productSearchBlob()} LIKE ${pattern} ESCAPE '\\'
    OR ${brandExpr()} LIKE ${pattern} ESCAPE '\\'
    OR EXISTS (
      SELECT 1 FROM "Category" c
      WHERE (c.id = p."categoryId" OR c.id = p."subcategoryId" OR c.id = p."tertiaryCategoryId")
        AND ${categoryExpr()} LIKE ${pattern} ESCAPE '\\'
    )
    OR EXISTS (
      SELECT 1 FROM "ProductShade" s
      WHERE s."productId" = p.id
        AND (
          ${shadeText} LIKE ${pattern} ESCAPE '\\'
          OR coalesce(s.barcode, '') ILIKE ${pattern} ESCAPE '\\'
        )
    )
    OR ${assistantTagExpr()} LIKE ${pattern} ESCAPE '\\'
  )`;
}

function termScoreClause(pattern: string, starts: string): Prisma.Sql {
  const nameRank = productNameExpr();
  const blob = productSearchBlob();
  return Prisma.sql`(
    CASE WHEN ${nameRank} LIKE ${starts} ESCAPE '\\' THEN 95 ELSE 0 END +
    CASE WHEN ${nameRank} LIKE ${pattern} ESCAPE '\\' THEN 75 ELSE 0 END +
    CASE WHEN ${brandExpr()} LIKE ${pattern} ESCAPE '\\' THEN 55 ELSE 0 END +
    CASE WHEN ${blob} LIKE ${pattern} ESCAPE '\\' THEN 35 ELSE 0 END +
    CASE WHEN ${assistantTagExpr()} LIKE ${pattern} ESCAPE '\\' THEN 25 ELSE 0 END
  )`;
}

/**
 * بحث ذكي للمتجر — ترتيب بالملاءمة، عربي/إنجليزي، مرادفات، ووسوم المساعد.
 * يرجّع معرّفات مرتبة (الأكثر صلة أولاً).
 */
export async function searchStorefrontProductIds(
  prisma: PrismaClient,
  raw: string,
  limit = 80,
): Promise<string[]> {
  const normalized = normalizeSearchText(raw);
  if (normalized.length < 2) return [];

  const tokens = rawTokens(raw);
  const expandedTerms = [...new Set(tokens.flatMap((token) => expandSearchTerms(token)))].slice(0, 24);
  if (!expandedTerms.length) return [];

  const matchClauses = expandedTerms.map((term) => termMatchClause(likePattern(term)));
  const scoreClauses = expandedTerms.map((term) => termScoreClause(likePattern(term), startsPattern(term)));

  const fullPattern = likePattern(normalized);
  const fullStarts = startsPattern(normalized);
  const nameRank = productNameExpr();

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT p.id
    FROM "Product" p
    LEFT JOIN "Brand" b ON b.id = p."brandId"
    LEFT JOIN "AssistantProductTag" apt ON apt."productId" = p.id
    WHERE p."isActive" = true
      AND (${Prisma.join(matchClauses, " OR ")})
    ORDER BY
      CASE WHEN ${nameRank} LIKE ${fullPattern} ESCAPE '\\' THEN 0 ELSE 1 END,
      CASE WHEN ${nameRank} LIKE ${fullStarts} ESCAPE '\\' THEN 0 ELSE 1 END,
      (${Prisma.join(scoreClauses, " + ")}) DESC,
      p."soldCount" DESC,
      p.rating DESC,
      p."createdAt" DESC
    LIMIT ${Math.min(Math.max(limit, 1), 200)}
  `;
  return rows.map((row) => row.id);
}

/** @deprecated استخدم searchStorefrontProductIds — يُبقى للتوافق */
export async function findSmartProductIds(prisma: PrismaClient, raw: string): Promise<string[]> {
  return searchStorefrontProductIds(prisma, raw, 200);
}

/** بحث المساعد: نفس التطابق، مع الوصف وطريقة الاستخدام والمكونات حتى تلقى الفائدة مو الاسم بس. */
export async function findAssistantProductIds(
  prisma: PrismaClient,
  raw: string,
  order: "popular" | "price" | "priceAsc" = "popular",
): Promise<string[]> {
  const ids = await searchStorefrontProductIds(prisma, raw, 80);
  if (!ids.length) return [];

  const ordering =
    order === "price"
      ? Prisma.sql`p.price DESC, p.rating DESC`
      : order === "priceAsc"
        ? Prisma.sql`p.price ASC, p.rating DESC`
        : Prisma.sql`p."soldCount" DESC, p.rating DESC`;

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT p.id
    FROM "Product" p
    WHERE p.id IN (${Prisma.join(ids)})
    ORDER BY ${ordering}
    LIMIT 80
  `;
  return rows.map((row) => row.id);
}
