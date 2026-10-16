import '../../core/utils/json.dart';
import 'paginated.dart';
import 'product.dart';

/// إكمال للنص أثناء الكتابة («شامبو للقشرة»، «لوريال باريس»).
class SearchCompletion {
  final String text;
  /// term | brand | phrase
  final String type;
  const SearchCompletion(this.text, this.type);
}

/// منتج مصغّر في الاقتراحات الفورية (بلا تفاصيل ثقيلة).
class InstantProduct {
  final String id;
  final String slug;
  final String name;
  final String brand;
  final int price;
  final int originalPrice;
  final int discountPercent;
  final String image;
  final bool inStock;

  const InstantProduct({
    required this.id,
    required this.slug,
    required this.name,
    required this.brand,
    required this.price,
    required this.originalPrice,
    required this.discountPercent,
    required this.image,
    required this.inStock,
  });

  String get route => '/product/${slug.isNotEmpty ? slug : id}';
  bool get hasDiscount => discountPercent > 0 && originalPrice > price;

  factory InstantProduct.fromJson(Map<String, dynamic> j) => InstantProduct(
        id: asString(j['id']),
        slug: asString(j['slug']),
        name: asString(j['name']),
        brand: asString(j['brand']),
        price: asInt(j['price']),
        originalPrice: asInt(j['originalPrice']),
        discountPercent: asInt(j['discountPercent']),
        image: asString(j['image']),
        inStock: j['inStock'] != false,
      );
}

/// عنصر عدّاد (براند/نوع/قسم) مع عدد نتائجه.
class SearchFacet {
  final String id;
  final String name;
  final String slug;
  final int count;
  const SearchFacet({required this.id, required this.name, this.slug = '', this.count = 0});

  factory SearchFacet.fromJson(Map<String, dynamic> j) => SearchFacet(
        id: asString(j['id']),
        name: asString(j['name']),
        slug: asString(j['slug']),
        count: asInt(j['count']),
      );
}

class SearchInstant {
  final String query;
  final String? corrected;
  final List<String> understood;
  final List<SearchCompletion> completions;
  final List<InstantProduct> products;
  final List<SearchFacet> brands;
  final List<SearchFacet> categories;
  final int total;

  const SearchInstant({
    required this.query,
    this.corrected,
    this.understood = const [],
    this.completions = const [],
    this.products = const [],
    this.brands = const [],
    this.categories = const [],
    this.total = 0,
  });

  bool get isEmpty => products.isEmpty && completions.isEmpty && brands.isEmpty && categories.isEmpty;

  factory SearchInstant.fromJson(Map<String, dynamic> j) => SearchInstant(
        query: asString(j['query']),
        corrected: j['corrected']?.toString(),
        understood: asStringList(j['understood']),
        completions: asList(j['completions']).map((e) => SearchCompletion(asString(e['text']), asString(e['type']))).toList(),
        products: asList(j['products']).map(InstantProduct.fromJson).toList(),
        brands: asList(j['brands']).map(SearchFacet.fromJson).toList(),
        categories: asList(j['categories']).map(SearchFacet.fromJson).toList(),
        total: asInt(j['total']),
      );
}

/// ترتيب النتائج.
enum SearchSort {
  relevance('relevance', 'الأنسب'),
  priceAsc('price_asc', 'الأرخص'),
  priceDesc('price_desc', 'الأغلى'),
  best('best', 'الأكثر مبيعاً'),
  newest('new', 'الأحدث'),
  discount('discount', 'أعلى خصم');

  final String api;
  final String label;
  const SearchSort(this.api, this.label);
}

/// فلاتر صفحة النتائج.
class SearchFilters {
  final SearchSort sort;
  final Set<String> brandIds;
  final String? kind;
  final String? categoryId;
  final bool inStock;
  final bool deals;
  final int? minPrice;
  final int? maxPrice;

  const SearchFilters({
    this.sort = SearchSort.relevance,
    this.brandIds = const {},
    this.kind,
    this.categoryId,
    this.inStock = false,
    this.deals = false,
    this.minPrice,
    this.maxPrice,
  });

  bool get active =>
      sort != SearchSort.relevance || brandIds.isNotEmpty || kind != null || categoryId != null || inStock || deals || minPrice != null || maxPrice != null;

  int get count =>
      (brandIds.isNotEmpty ? 1 : 0) + (kind != null ? 1 : 0) + (categoryId != null ? 1 : 0) + (inStock ? 1 : 0) + (deals ? 1 : 0) + (minPrice != null || maxPrice != null ? 1 : 0);

  SearchFilters copyWith({
    SearchSort? sort,
    Set<String>? brandIds,
    String? kind,
    bool clearKind = false,
    String? categoryId,
    bool clearCategory = false,
    bool? inStock,
    bool? deals,
    int? minPrice,
    int? maxPrice,
    bool clearPrice = false,
  }) =>
      SearchFilters(
        sort: sort ?? this.sort,
        brandIds: brandIds ?? this.brandIds,
        kind: clearKind ? null : (kind ?? this.kind),
        categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
        inStock: inStock ?? this.inStock,
        deals: deals ?? this.deals,
        minPrice: clearPrice ? null : (minPrice ?? this.minPrice),
        maxPrice: clearPrice ? null : (maxPrice ?? this.maxPrice),
      );

  Map<String, dynamic> toQuery() => {
        if (sort != SearchSort.relevance) 'sort': sort.api,
        if (brandIds.isNotEmpty) 'brand': brandIds.join(','),
        if (kind != null) 'kind': kind,
        if (categoryId != null) 'category': categoryId,
        if (inStock) 'inStock': '1',
        if (deals) 'deals': '1',
        if (minPrice != null) 'minPrice': minPrice,
        if (maxPrice != null) 'maxPrice': maxPrice,
      };
}

class SearchPage {
  final Paginated<Product> page;
  final List<SearchFacet> brands;
  final List<SearchFacet> kinds;
  final List<SearchFacet> categories;
  final int? priceMin;
  final int? priceMax;
  final String? corrected;
  final List<String> understood;

  const SearchPage({
    required this.page,
    this.brands = const [],
    this.kinds = const [],
    this.categories = const [],
    this.priceMin,
    this.priceMax,
    this.corrected,
    this.understood = const [],
  });

  factory SearchPage.fromJson(Map<String, dynamic> j) {
    final f = asMap(j['facets']);
    final price = asMap(f['price']);
    return SearchPage(
      page: Paginated.fromJson(j, Product.fromJson),
      brands: asList(f['brands']).map(SearchFacet.fromJson).toList(),
      kinds: asList(f['kinds']).map(SearchFacet.fromJson).toList(),
      categories: asList(f['categories']).map(SearchFacet.fromJson).toList(),
      priceMin: price.isEmpty ? null : asInt(price['min']),
      priceMax: price.isEmpty ? null : asInt(price['max']),
      corrected: j['corrected']?.toString(),
      understood: asStringList(j['understood']),
    );
  }
}
