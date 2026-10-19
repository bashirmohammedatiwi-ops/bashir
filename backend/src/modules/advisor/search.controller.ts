import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { SearchSort } from "./engine/search";
import { SearchLang, SearchService } from "./search.service";

const SORTS = new Set<SearchSort>(["relevance", "price_asc", "price_desc", "new", "best", "rating", "discount"]);
const num = (v?: string) => {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};
const flag = (v?: string) => v === "1" || v === "true";
const langOf = (v?: string): SearchLang => (v === "en" ? "en" : "ar");
/** slug عالم معقول فقط (حروف وأرقام وشرطات) — غير ذلك يُتجاهل. */
const worldOf = (v?: string) => {
  const slug = v?.trim();
  return slug && slug.length <= 80 && /^[\p{L}\p{N}_-]+$/u.test(slug) ? slug : undefined;
};

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly search: SearchService) {}

  /** اقتراحات فورية أثناء الكتابة. `lang=en` للأسماء الإنجليزية، `world` لحصرها بعالم. */
  @Public()
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  @Get("instant")
  instant(@Query("q") q?: string, @Query("lang") lang?: string, @Query("world") world?: string) {
    return this.search.instant(q ?? "", { lang: langOf(lang), world: worldOf(world) });
  }

  /** الأكثر بحثاً (عبارات مجهولة الهوية وجدت نتائج) — `lang` ar|en. */
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get("trending")
  trending(@Query("lang") lang?: string) {
    return this.search.trending(langOf(lang));
  }

  /**
   * صفحة النتائج. كلها اختيارية: `lang` (ar|en)، `world` (slug)، `noBudget=1` يلغي الميزانية
   * المفهومة من النص، `exact=1` بلا تصحيح إملائي، `sort=rating` الأعلى تقييماً.
   */
  @Public()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Get()
  results(
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: string,
    @Query("brand") brand?: string,
    @Query("category") category?: string,
    @Query("kind") kind?: string,
    @Query("minPrice") minPrice?: string,
    @Query("maxPrice") maxPrice?: string,
    @Query("inStock") inStock?: string,
    @Query("deals") deals?: string,
    @Query("noBudget") noBudget?: string,
    @Query("exact") exact?: string,
    @Query("lang") lang?: string,
    @Query("world") world?: string,
    @Req() req?: { ip?: string },
  ) {
    return this.search.results(
      q ?? "",
      {
        brandIds: brand ? brand.split(",").filter(Boolean).slice(0, 10) : undefined,
        categoryId: category || undefined,
        kind: kind || undefined,
        minPrice: num(minPrice),
        maxPrice: num(maxPrice),
        inStock: flag(inStock),
        deals: flag(deals),
        noBudget: flag(noBudget),
        sort: SORTS.has(sort as SearchSort) ? (sort as SearchSort) : "relevance",
      },
      num(page) ?? 1,
      num(limit) ?? 24,
      // العنوان يُستعمل لعدّ الباحثات المختلفات في «الأكثر بحثاً» فقط (بصمة مملّحة، لا يُحفظ).
      { lang: langOf(lang), world: worldOf(world), exact: flag(exact), client: req?.ip },
    );
  }
}
