class AiAutofillImage {
  const AiAutofillImage({
    required this.url,
    required this.thumbUrl,
    required this.title,
    required this.source,
  });

  final String url;
  final String thumbUrl;
  final String title;
  final String source;

  factory AiAutofillImage.fromJson(Map<String, dynamic> json) {
    return AiAutofillImage(
      url: json['url']?.toString() ?? '',
      thumbUrl: json['thumbUrl']?.toString() ?? json['url']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      source: json['source']?.toString() ?? '',
    );
  }
}

class AiAutofillCategory {
  const AiAutofillCategory({
    this.categoryId,
    this.subcategoryId,
    this.tertiaryCategoryId,
    this.categoryNameAr,
    this.subcategoryNameAr,
    this.tertiaryNameAr,
  });

  final String? categoryId;
  final String? subcategoryId;
  final String? tertiaryCategoryId;
  final String? categoryNameAr;
  final String? subcategoryNameAr;
  final String? tertiaryNameAr;

  factory AiAutofillCategory.fromJson(Map<String, dynamic> json) {
    return AiAutofillCategory(
      categoryId: json['categoryId']?.toString(),
      subcategoryId: json['subcategoryId']?.toString(),
      tertiaryCategoryId: json['tertiaryCategoryId']?.toString(),
      categoryNameAr: json['categoryNameAr']?.toString(),
      subcategoryNameAr: json['subcategoryNameAr']?.toString(),
      tertiaryNameAr: json['tertiaryNameAr']?.toString(),
    );
  }
}

class ExistingProductInfo {
  const ExistingProductInfo({
    required this.id,
    this.sku,
    this.barcode,
    this.name,
    this.nameAr,
    this.nameEn,
    this.isActive,
    this.price,
    this.stock,
    this.brandName,
    this.matchedShadeName,
  });

  final String id;
  final String? sku;
  final String? barcode;
  final String? name;
  final String? nameAr;
  final String? nameEn;
  final bool? isActive;
  final num? price;
  final num? stock;
  final String? brandName;
  final String? matchedShadeName;

  String get displayName {
    if (nameAr?.trim().isNotEmpty == true) return nameAr!.trim();
    if (name?.trim().isNotEmpty == true) return name!.trim();
    if (nameEn?.trim().isNotEmpty == true) return nameEn!.trim();
    return sku ?? id;
  }

  factory ExistingProductInfo.fromJson(Map<String, dynamic> json) {
    final brand = json['brand'];
    String? brandName;
    if (brand is Map) {
      brandName = (brand['nameAr'] ?? brand['nameEn'] ?? brand['name'])?.toString();
    }
    return ExistingProductInfo(
      id: json['id']?.toString() ?? '',
      sku: json['sku']?.toString(),
      barcode: json['barcode']?.toString(),
      name: json['name']?.toString(),
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
      isActive: json['isActive'] == true,
      price: json['price'] as num?,
      stock: json['stock'] as num?,
      brandName: brandName,
      matchedShadeName: json['matchedShadeName']?.toString(),
    );
  }
}

class AiAutofillResult {
  const AiAutofillResult({
    required this.barcode,
    required this.brandAr,
    required this.brandEn,
    required this.nameAr,
    required this.nameEn,
    required this.descriptionAr,
    required this.descriptionEn,
    required this.category,
    required this.confidence,
    required this.needsReview,
    required this.images,
    this.exists = false,
    this.existingProduct,
    this.reviewNotes,
    this.sourceUrl,
    this.model,
    this.usedWebSearch = false,
    this.imageQuery,
    this.aiSkipped = false,
  });

  final String barcode;
  final bool exists;
  final ExistingProductInfo? existingProduct;
  final String brandAr;
  final String brandEn;
  final String nameAr;
  final String nameEn;
  final String descriptionAr;
  final String descriptionEn;
  final AiAutofillCategory category;
  final num confidence;
  final bool needsReview;
  final String? reviewNotes;
  final String? sourceUrl;
  final List<AiAutofillImage> images;
  final String? model;
  final bool usedWebSearch;
  final String? imageQuery;
  final bool aiSkipped;

  factory AiAutofillResult.fromJson(Map<String, dynamic> json) {
    final images = (json['images'] as List? ?? [])
        .map((e) => AiAutofillImage.fromJson(Map<String, dynamic>.from(e as Map)))
        .where((i) => i.url.isNotEmpty)
        .toList();
    final meta = json['meta'] is Map ? Map<String, dynamic>.from(json['meta'] as Map) : <String, dynamic>{};
    final productRaw = json['product'];
    return AiAutofillResult(
      barcode: json['barcode']?.toString() ?? '',
      exists: json['exists'] == true,
      existingProduct: productRaw is Map
          ? ExistingProductInfo.fromJson(Map<String, dynamic>.from(productRaw))
          : null,
      brandAr: json['brandAr']?.toString() ?? '',
      brandEn: json['brandEn']?.toString() ?? '',
      nameAr: json['nameAr']?.toString() ?? '',
      nameEn: json['nameEn']?.toString() ?? '',
      descriptionAr: json['descriptionAr']?.toString() ?? '',
      descriptionEn: json['descriptionEn']?.toString() ?? '',
      category: AiAutofillCategory.fromJson(Map<String, dynamic>.from((json['category'] as Map?) ?? {})),
      confidence: json['confidence'] as num? ?? 0,
      needsReview: json['needsReview'] == true,
      reviewNotes: json['reviewNotes']?.toString(),
      sourceUrl: json['sourceUrl']?.toString(),
      images: images,
      model: meta['model']?.toString(),
      usedWebSearch: meta['usedWebSearch'] == true,
      imageQuery: meta['imageQuery']?.toString(),
      aiSkipped: meta['aiSkipped'] == true,
    );
  }
}

class BarcodeCheckResult {
  const BarcodeCheckResult({
    required this.exists,
    this.product,
    this.matchedShadeName,
  });

  final bool exists;
  final ExistingProductInfo? product;
  final String? matchedShadeName;

  factory BarcodeCheckResult.fromJson(Map<String, dynamic> json) {
    final productRaw = json['product'];
    return BarcodeCheckResult(
      exists: json['exists'] == true,
      product: productRaw is Map
          ? ExistingProductInfo.fromJson(Map<String, dynamic>.from(productRaw))
          : null,
      matchedShadeName: json['matchedShadeName']?.toString(),
    );
  }
}
