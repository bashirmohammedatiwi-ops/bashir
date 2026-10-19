import '../../core/utils/json.dart';
import 'brand.dart';
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

  /// نسخة مبدئية تُعرض فوراً في صفحة المنتج حتى تصل التفاصيل الكاملة.
  ///
  /// خفيفة: بلا درجات ولا أوصاف — لا تُستخدم للإضافة للسلة قبل وصول المنتج الكامل.
  Product toSeed() => Product(
        id: id,
        sku: '',
        name: name,
        slug: slug,
        brand: brand.trim().isEmpty ? null : Brand(id: '', name: brand.trim(), slug: ''),
        price: price,
        originalPrice: originalPrice,
        discountPercent: discountPercent,
        images: image.trim().isEmpty ? const [] : [ProductImage(url: image)],
        stock: inStock ? 1 : 0,
      );

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

/// ترتيب النتائج — [api] القيمة التي يفهمها السيرفر.
enum SearchSort {
  relevance('relevance'),
  priceAsc('price_asc'),
  priceDesc('price_desc'),
  best('best'),
  rating('rating'),
  newest('new'),
  discount('discount');

  final String api;
  const SearchSort(this.api);
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

  /// تجاهل الميزانية التي يستنتجها السيرفر من نص البحث («تحت 50 ألف») — عند اختيار سعر صريح.
  final bool ignoreBudget;

  /// البحث بالكلمة كما كُتبت بلا تصحيح إملائي («ابحثي عن … بدلاً من ذلك»).
  final bool exact;

  const SearchFilters({
    this.sort = SearchSort.relevance,
    this.brandIds = const {},
    this.kind,
    this.categoryId,
    this.inStock = false,
    this.deals = false,
    this.minPrice,
    this.maxPrice,
    this.ignoreBudget = false,
    this.exact = false,
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
    bool? ignoreBudget,
    bool? exact,
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
        ignoreBudget: ignoreBudget ?? this.ignoreBudget,
        exact: exact ?? this.exact,
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
        if (ignoreBudget) 'noBudget': '1',
        if (exact) 'exact': '1',
      };
}

/// شريحة سعر من السيرفر مع عدد نتائجها (null = بلا حد).
class SearchPriceBucket {
  final int? min;
  final int? max;
  final int count;
  const SearchPriceBucket({this.min, this.max, this.count = 0});

  factory SearchPriceBucket.fromJson(Map<String, dynamic> j) => SearchPriceBucket(
        min: j['min'] == null ? null : asInt(j['min']),
        max: j['max'] == null ? null : asInt(j['max']),
        count: asInt(j['count']),
      );
}

class SearchPage {
  final Paginated<Product> page;
  final List<SearchFacet> brands;
  final List<SearchFacet> kinds;
  final List<SearchFacet> categories;
  final int? priceMin;
  final int? priceMax;

  /// شرائح السعر من السيرفر (فارغة إن لم يرسلها) — على مدى النتائج قبل فلتر السعر.
  final List<SearchPriceBucket> priceBuckets;

  /// الحد الأعلى للسعر الذي استنتجه السيرفر من نص البحث («عطر تحت 50 ألف»).
  final int? budget;
  final String? corrected;
  final List<String> understood;

  const SearchPage({
    required this.page,
    this.brands = const [],
    this.kinds = const [],
    this.categories = const [],
    this.priceMin,
    this.priceMax,
    this.priceBuckets = const [],
    this.budget,
    this.corrected,
    this.understood = const [],
  });

  factory SearchPage.fromJson(Map<String, dynamic> j) {
    final f = asMap(j['facets']);
    final price = asMap(f['price']);
    final rawBudget = j['budget'];
    final budget = rawBudget is Map ? rawBudget['max'] : rawBudget;
    return SearchPage(
      page: Paginated.fromJson(j, Product.fromJson),
      brands: asList(f['brands']).map(SearchFacet.fromJson).toList(),
      kinds: asList(f['kinds']).map(SearchFacet.fromJson).toList(),
      categories: asList(f['categories']).map(SearchFacet.fromJson).toList(),
      priceMin: price.isEmpty ? null : asInt(price['min']),
      priceMax: price.isEmpty ? null : asInt(price['max']),
      priceBuckets: asList(f['priceBuckets'] ?? j['priceBuckets']).map(SearchPriceBucket.fromJson).toList(),
      budget: budget == null ? null : (asInt(budget) > 0 ? asInt(budget) : null),
      corrected: j['corrected']?.toString(),
      understood: asStringList(j['understood']),
    );
  }
}
