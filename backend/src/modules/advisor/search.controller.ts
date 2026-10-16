import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { SearchSort } from "./engine/search";
import { SearchService } from "./search.service";

const SORTS = new Set<SearchSort>(["relevance", "price_asc", "price_desc", "new", "best", "rating", "discount"]);
const num = (v?: string) => {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

@ApiTags("search")
@Controller("search")
export class SearchController {
  constructor(private readonly search: SearchService) {}

  /** اقتراحات فورية أثناء الكتابة. */
  @Public()
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  @Get("instant")
  instant(@Query("q") q?: string) {
    return this.search.instant(q ?? "");
  }

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
  ) {
    return this.search.results(
      q ?? "",
      {
        brandIds: brand ? brand.split(",").filter(Boolean).slice(0, 10) : undefined,
        categoryId: category || undefined,
        kind: kind || undefined,
        minPrice: num(minPrice),
        maxPrice: num(maxPrice),
        inStock: inStock === "1" || inStock === "true",
        deals: deals === "1" || deals === "true",
        sort: SORTS.has(sort as SearchSort) ? (sort as SearchSort) : "relevance",
      },
      num(page) ?? 1,
      num(limit) ?? 24,
    );
  }
}
