import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { getCached, setCached } from "../../common/memory-cache.util";
import { rewriteProductMediaUrls } from "../../common/media-url.util";
import { withPlaceholderImages } from "../../common/product-placeholder.util";
import { productRelationsLite, worldProductIds } from "../catalog/products.service";
import { AdvisorService } from "./advisor.service";
import { FacetCount, SearchFilters, completionsFor, searchCatalog } from "./engine/search";

export type SearchLang = "ar" | "en";

/** خيارات العرض والنطاق — كلها اختيارية فالمتجر القديم يبقى كما هو. */
export interface SearchRequestOptions {
  /** لغة الأسماء المعروضة (منتجات، أقسام، أنواع، ما فُهم). */
  lang?: SearchLang;
  /** slug عالم يحصر النتائج بأقسامه. */
  world?: string;
  /** بلا تصحيح إملائي: «ابحثي عن الكلمة الأصلية بدلاً من ذلك». */
  exact?: boolean;
}

/**
 * بحث المتجر الجديد: الترتيب كله في الذاكرة (فهرس «ديما»)، وقاعدة البيانات تُسأل
 * فقط عن صفحة النتائج المعروضة (24 منتجاً بمعرّفاتها) — بدل استعلامات تشابه نصي ثقيلة.
 */
@Injectable()
export class SearchService {
  constructor(
    private readonly advisor: AdvisorService,
    private readonly prisma: PrismaService,
  ) {}

  /** أثناء الكتابة: إكمالات + براندات + أقسام + 8 منتجات — بلا قاعدة بيانات (عدا ذاكرة مؤقتة للنطاق والأسماء). */
  async instant(query: string, opts: SearchRequestOptions = {}) {
    const q = query.slice(0, 80);
    if (q.trim().length < 2) return { query: q, completions: [], products: [], brands: [], categories: [], total: 0 };
    const lang = opts.lang ?? "ar";
    const [catalog, scopeIds] = await Promise.all([this.advisor.catalog(), this.worldScope(opts.world)]);
    const out = searchCatalog(catalog, q, { scopeIds }, { instant: true, lang });
    const top = [...out.hits.filter((h) => h.p.stock > 0), ...out.hits.filter((h) => h.p.stock <= 0)].slice(0, 8);
    return {
      query: q,
      corrected: out.corrected ?? null,
      understood: out.understood,
      completions: completionsFor(catalog, q, out.hits, { lang }),
      products: top.map(({ p }) => ({
        id: p.id,
        slug: p.slug,
        name: lang === "en" ? p.nameEn || p.name : p.name,
        brand: p.brand,
        price: p.price,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        image: p.image,
        inStock: p.stock > 0,
      })),
      brands: out.facets.brands.slice(0, 4),
      categories: await this.localizeCategories(out.facets.categories.slice(0, 4), lang),
      total: out.hits.length,
    };
  }

  /** صفحة نتائج مرتبة بالملاءمة مع الفلاتر وعدّاداتها. */
  async results(query: string, f: SearchFilters, page = 1, limit = 24, opts: SearchRequestOptions = {}) {
    const q = query.slice(0, 120);
    const take = Math.min(Math.max(limit, 1), 48);
    const pg = Math.max(1, page);
    const lang = opts.lang ?? "ar";
    const [catalog, scopeIds] = await Promise.all([this.advisor.catalog(), this.worldScope(opts.world)]);
    const out = searchCatalog(catalog, q, { ...f, scopeIds }, { exact: opts.exact, lang });
    const ids = out.hits.slice((pg - 1) * take, pg * take).map((h) => h.p.id);
    const rows = ids.length
      ? await this.prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include: productRelationsLite })
      : [];
    const order = new Map(ids.map((id, i) => [id, i]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    // البحث الأول فقط (لا تغيير فلتر ولا صفحة تالية) — وإلا تُعدّ العبارة مرات لبحث واحد.
    if (pg === 1 && !hasFilters(f)) void this.recordQuery(q, lang, out.hits.length);
    return {
      ...paginate(rows.map((p) => withPlaceholderImages(rewriteProductMediaUrls(p))), out.hits.length, pg, take),
      facets: { ...out.facets, categories: await this.localizeCategories(out.facets.categories, lang) },
      corrected: out.corrected ?? null,
      understood: out.understood,
      // الميزانية المفهومة من النص والمطبّقة فعلاً — ليعرضها التطبيق على شريحة السعر ويتيح إلغاءها (noBudget=1).
      budget: out.budget?.max ?? null,
      budgetMin: out.budget?.min ?? null,
    };
  }

  /**
   * الأكثر بحثاً فعلاً — لاقتراحات شاشة البحث: عبارات وجدت نتائج في آخر بحث، بُحث عنها
   * خلال 14 يوماً، و3 مرات على الأقل (عبارة نادرة قد تكون شخصية فلا تُعرض لغير صاحبتها).
   * تُحفظ 10 دقائق.
   */
  async trending(lang: SearchLang, limit = 12) {
    const key = `search:trending:${lang}:${limit}`;
    const hit = getCached<{ items: { q: string; count: number }[] }>(key);
    if (hit) return hit;
    const since = new Date(Date.now() - 14 * 24 * 60 * 60_000);
    const rows = await this.prisma.searchQueryStat
      .findMany({
        where: { lang, lastTotal: { gt: 0 }, count: { gte: 3 }, lastAt: { gte: since } },
        orderBy: [{ count: "desc" }, { lastAt: "desc" }],
        take: Math.min(Math.max(limit, 1), 20),
        select: { q: true, count: true },
      })
      .catch(() => [] as { q: string; count: number }[]);
    const out = { items: rows };
    setCached(key, out, 10 * 60_000);
    return out;
  }

  /** يسجّل العبارة بلا هوية صاحبتها (عدد مرات البحث، ومرات «لا نتائج»). الفشل لا يمس البحث. */
  private async recordQuery(raw: string, lang: SearchLang, total: number) {
    const q = normalizeStatQuery(raw);
    if (!q) return;
    try {
      await this.prisma.searchQueryStat.upsert({
        where: { q_lang: { q, lang } },
        create: { q, lang, count: 1, zeroCount: total > 0 ? 0 : 1, lastTotal: total },
        update: {
          count: { increment: 1 },
          ...(total > 0 ? {} : { zeroCount: { increment: 1 } }),
          lastTotal: total,
        },
      });
    } catch {
      // بحثان متزامنان لعبارة جديدة (P2002) أو جدول لم يُنشأ بعد — لا يهم.
    }
  }

  private worldScope(world?: string): Promise<ReadonlySet<string> | undefined> {
    if (!world?.trim()) return Promise.resolve(undefined);
    // تعذّر تحميل النطاق لا يُسقط البحث — نبحث بكل المتجر.
    return worldProductIds(this.prisma, world)
      .then((ids) => ids ?? undefined)
      .catch(() => undefined);
  }

  /** أسماء الأقسام بالإنجليزية (nameEn، وإلا الاسم الأصلي) — الفهرس يحفظ العربية فقط. */
  private async localizeCategories(items: FacetCount[], lang: SearchLang): Promise<FacetCount[]> {
    if (lang !== "en" || !items.length) return items;
    const names = await this.categoryNamesEn();
    return items.map((c) => ({ ...c, name: names.get(c.id) || c.name }));
  }

  /** جدول id ← الاسم الإنجليزي لكل الأقسام، يُحفظ 5 دقائق (بضع مئات من الصفوف). */
  private async categoryNamesEn(): Promise<Map<string, string>> {
    const key = "search:category-names-en";
    const hit = getCached<Map<string, string>>(key);
    if (hit) return hit;
    const rows = await this.prisma.category
      .findMany({ select: { id: true, name: true, nameEn: true } })
      .catch(() => [] as { id: string; name: string; nameEn: string | null }[]);
    const map = new Map(rows.map((r) => [r.id, (r.nameEn || r.name || "").trim()]));
    setCached(key, map, 5 * 60_000);
    return map;
  }
}

/** بحث بفلتر (براند، قسم، سعر…) — تضييق لعبارة سُجّلت أصلاً. */
function hasFilters(f: SearchFilters): boolean {
  return Boolean(
    f.brandIds?.length || f.categoryId || f.kind || f.minPrice != null || f.maxPrice != null || f.inStock || f.deals,
  );
}

/**
 * العبارة كما تُحفظ: مسافات موحّدة، أحرف صغيرة، 2–60 حرفاً. ما فيه 5 أرقام متتالية
 * (هاتف، باركود، رقم طلب) لا يُحفظ أبداً.
 */
export function normalizeStatQuery(raw: string): string | null {
  const q = raw.replace(/\s+/g, " ").trim().toLowerCase();
  if (q.length < 2 || q.length > 60) return null;
  if (/[0-9٠-٩۰-۹]{5,}/.test(q)) return null;
  return q;
}
