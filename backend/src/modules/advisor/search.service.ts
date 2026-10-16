import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { paginate } from "../../common/dto/pagination.dto";
import { rewriteProductMediaUrls } from "../../common/media-url.util";
import { withPlaceholderImages } from "../../common/product-placeholder.util";
import { productRelationsLite } from "../catalog/products.service";
import { AdvisorService } from "./advisor.service";
import { SearchFilters, completionsFor, searchCatalog } from "./engine/search";

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

  /** أثناء الكتابة: إكمالات + براندات + أقسام + 8 منتجات — بلا قاعدة بيانات. */
  async instant(query: string) {
    const q = query.slice(0, 80);
    if (q.trim().length < 2) return { query: q, completions: [], products: [], brands: [], categories: [], total: 0 };
    const catalog = await this.advisor.catalog();
    const out = searchCatalog(catalog, q, {}, { instant: true });
    const top = [...out.hits.filter((h) => h.p.stock > 0), ...out.hits.filter((h) => h.p.stock <= 0)].slice(0, 8);
    return {
      query: q,
      corrected: out.corrected ?? null,
      understood: out.understood,
      completions: completionsFor(catalog, q, out.hits),
      products: top.map(({ p }) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        price: p.price,
        originalPrice: p.originalPrice,
        discountPercent: p.discountPercent,
        image: p.image,
        inStock: p.stock > 0,
      })),
      brands: out.facets.brands.slice(0, 4),
      categories: out.facets.categories.slice(0, 4),
      total: out.hits.length,
    };
  }

  /** صفحة نتائج مرتبة بالملاءمة مع الفلاتر وعدّاداتها. */
  async results(query: string, f: SearchFilters, page = 1, limit = 24) {
    const q = query.slice(0, 120);
    const take = Math.min(Math.max(limit, 1), 48);
    const pg = Math.max(1, page);
    const catalog = await this.advisor.catalog();
    const out = searchCatalog(catalog, q, f);
    const ids = out.hits.slice((pg - 1) * take, pg * take).map((h) => h.p.id);
    const rows = ids.length
      ? await this.prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include: productRelationsLite })
      : [];
    const order = new Map(ids.map((id, i) => [id, i]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    return {
      ...paginate(rows.map((p) => withPlaceholderImages(rewriteProductMediaUrls(p))), out.hits.length, pg, take),
      facets: out.facets,
      corrected: out.corrected ?? null,
      understood: out.understood,
    };
  }
}
