import '../../core/utils/json.dart';

/// منتج مصغّر من اقتراحات البحث الحية (`GET /products/search/suggest`).
class SuggestProduct {
  final String id;
  final String slug;
  final String name;
  final String? brandName;

  /// السعر النهائي (بعد الخصم) بأصغر وحدة عملة — نفس معنى `Product.price`.
  final int price;
  final int discountPercent;
  final String? imageUrl;

  const SuggestProduct({
    required this.id,
    required this.slug,
    required this.name,
    this.brandName,
    this.price = 0,
    this.discountPercent = 0,
    this.imageUrl,
  });

  factory SuggestProduct.fromJson(Map<String, dynamic> json) {
    final brand = asString(json['brandName']).trim();
    final image = asString(json['imageUrl']).trim();
    return SuggestProduct(
      id: asString(json['id']),
      slug: asString(json['slug']),
      name: asString(json['name']).trim(),
      brandName: brand.isEmpty ? null : brand,
      price: asInt(json['price']),
      discountPercent: asInt(json['discountPercent']),
      imageUrl: image.isEmpty ? null : image,
    );
  }

  /// مسار صفحة المنتج — slug أولاً ثم المعرّف.
  String get route => '/product/${slug.isNotEmpty ? slug : id}';

  bool get hasDiscount => discountPercent > 0 && discountPercent < 100;

  /// السعر قبل الخصم مُستنتجاً من النسبة (الخادم لا يرسله في الاقتراحات).
  int? get oldPrice {
    if (!hasDiscount || price <= 0) return null;
    return (price * 100 / (100 - discountPercent)).round();
  }
}

/// براند أو قسم رئيسي مقترح — `{id, slug, name}`.
class SuggestRef {
  final String id;
  final String slug;
  final String name;

  const SuggestRef({required this.id, required this.slug, required this.name});

  factory SuggestRef.fromJson(Map<String, dynamic> json) =>
      SuggestRef(id: asString(json['id']), slug: asString(json['slug']), name: asString(json['name']).trim());
}

/// نتيجة الاقتراحات الحية: منتجات (≤6) + براندات (≤4) + أقسام رئيسية (≤3) + تصحيح إملائي.
class SearchSuggestions {
  final List<SuggestProduct> products;
  final List<SuggestRef> brands;
  final List<SuggestRef> categories;

  /// اقتراح «هل تقصدين…؟» — يرسله الخادم فقط حين لا تطابق أي منتج.
  final String? corrected;

  const SearchSuggestions({
    this.products = const [],
    this.brands = const [],
    this.categories = const [],
    this.corrected,
  });

  static const empty = SearchSuggestions();

  /// يقبل الجسم كما هو أو ملفوفاً في `{data: …}`.
  factory SearchSuggestions.fromJson(dynamic raw) {
    var json = asMap(raw);
    if (json['data'] is Map && !json.containsKey('products')) {
      json = asMap(json['data']);
    }
    final corrected = asString(json['corrected']).trim();
    return SearchSuggestions(
      products: asList(
        json['products'],
      ).map(SuggestProduct.fromJson).where((p) => p.id.isNotEmpty && p.name.isNotEmpty).toList(growable: false),
      brands: asList(
        json['brands'],
      ).map(SuggestRef.fromJson).where((b) => b.id.isNotEmpty && b.name.isNotEmpty).toList(growable: false),
      categories: asList(
        json['categories'],
      ).map(SuggestRef.fromJson).where((c) => c.id.isNotEmpty && c.name.isNotEmpty).toList(growable: false),
      corrected: corrected.isEmpty ? null : corrected,
    );
  }

  bool get isEmpty => products.isEmpty && brands.isEmpty && categories.isEmpty && corrected == null;
}
