class AiAutofillImage {
  const AiAutofillImage({
    required this.url,
    required this.thumbUrl,
    required this.title,
    required this.source,
    this.width,
    this.height,
  });

  final String url;
  final String thumbUrl;
  final String title;
  final String source;
  final int? width;
  final int? height;

  String? get sizeLabel {
    if (width != null && height != null && width! > 0 && height! > 0) {
      return '${width}×${height}';
    }
    return null;
  }

  factory AiAutofillImage.fromJson(Map<String, dynamic> json) {
    int? dim(dynamic v) {
      if (v is int) return v > 0 ? v : null;
      if (v is num) return v.toInt() > 0 ? v.toInt() : null;
      return int.tryParse(v?.toString() ?? '');
    }

    return AiAutofillImage(
      url: json['url']?.toString() ?? '',
      thumbUrl: json['thumbUrl']?.toString() ?? json['url']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      source: json['source']?.toString() ?? '',
      width: dim(json['width']),
      height: dim(json['height']),
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

class AiQualityIssue {
  const AiQualityIssue({
    required this.code,
    required this.severity,
    required this.field,
    required this.messageAr,
    this.current,
    this.suggested,
  });

  final String code;
  final String severity; // high | medium | low
  final String field;
  final String messageAr;
  final String? current;
  final String? suggested;

  bool get isHigh => severity == 'high';

  factory AiQualityIssue.fromJson(Map<String, dynamic> json) {
    return AiQualityIssue(
      code: json['code']?.toString() ?? '',
      severity: json['severity']?.toString() ?? 'medium',
      field: json['field']?.toString() ?? '',
      messageAr: json['messageAr']?.toString() ?? '',
      current: json['current']?.toString(),
      suggested: json['suggested']?.toString(),
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
    this.descriptionAr,
    this.descriptionEn,
    this.isActive,
    this.price,
    this.stock,
    this.brandId,
    this.brandName,
    this.categoryId,
    this.categoryName,
    this.matchedShadeName,
    this.imageCount = 0,
    this.shadeCount = 0,
    this.thumbUrl,
    this.imageUrls = const [],
  });

  final String id;
  final String? sku;
  final String? barcode;
  final String? name;
  final String? nameAr;
  final String? nameEn;
  final String? descriptionAr;
  final String? descriptionEn;
  final bool? isActive;
  final num? price;
  final num? stock;
  final String? brandId;
  final String? brandName;
  final String? categoryId;
  final String? categoryName;
  final String? matchedShadeName;
  final int imageCount;
  final int shadeCount;
  final String? thumbUrl;
  final List<String> imageUrls;

  String get displayName {
    if (nameAr?.trim().isNotEmpty == true) return nameAr!.trim();
    if (name?.trim().isNotEmpty == true) return name!.trim();
    if (nameEn?.trim().isNotEmpty == true) return nameEn!.trim();
    return sku ?? id;
  }

  factory ExistingProductInfo.fromJson(Map<String, dynamic> json) {
    final brand = json['brand'];
    String? brandName;
    String? brandId;
    if (brand is Map) {
      brandName = (brand['name'] ?? brand['nameAr'] ?? brand['nameEn'])?.toString();
      brandId = brand['id']?.toString();
    }
    brandId ??= json['brandId']?.toString();

    final category = json['category'];
    String? categoryName;
    if (category is Map) {
      categoryName = (category['nameAr'] ?? category['name'] ?? category['nameEn'])?.toString();
    }

    final count = json['_count'];
    var imageCount = 0;
    var shadeCount = 0;
    if (count is Map) {
      imageCount = int.tryParse('${count['images'] ?? 0}') ?? 0;
      shadeCount = int.tryParse('${count['shades'] ?? 0}') ?? 0;
    }

    final imageUrls = <String>[];
    String? thumb;
    final images = json['images'];
    if (images is List) {
      for (final row in images) {
        if (row is! Map) continue;
        final media = row['media'];
        String? url;
        if (media is Map) {
          url = (media['url'] ?? media['thumbnailUrl'])?.toString();
          thumb ??= (media['thumbnailUrl'] ?? media['url'])?.toString();
        }
        url ??= row['url']?.toString();
        if (url != null && url.isNotEmpty) imageUrls.add(url);
      }
      if (imageCount == 0) imageCount = imageUrls.length;
    }

    return ExistingProductInfo(
      id: json['id']?.toString() ?? '',
      sku: json['sku']?.toString(),
      barcode: json['barcode']?.toString(),
      name: json['name']?.toString(),
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
      descriptionAr: json['descriptionAr']?.toString(),
      descriptionEn: json['descriptionEn']?.toString(),
      isActive: json['isActive'] == true,
      price: json['price'] as num?,
      stock: json['stock'] as num?,
      brandId: brandId,
      brandName: brandName,
      categoryId: json['categoryId']?.toString(),
      categoryName: categoryName,
      matchedShadeName: json['matchedShadeName']?.toString(),
      imageCount: imageCount,
      shadeCount: shadeCount,
      thumbUrl: thumb ?? (imageUrls.isNotEmpty ? imageUrls.first : null),
      imageUrls: imageUrls,
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
    this.issues = const [],
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
  final List<AiQualityIssue> issues;

  factory AiAutofillResult.fromJson(Map<String, dynamic> json) {
    final images = (json['images'] as List? ?? [])
        .map((e) => AiAutofillImage.fromJson(Map<String, dynamic>.from(e as Map)))
        .where((i) => i.url.isNotEmpty)
        .toList();
    final meta = json['meta'] is Map ? Map<String, dynamic>.from(json['meta'] as Map) : <String, dynamic>{};
    final productRaw = json['product'];
    final issues = (json['issues'] as List? ?? [])
        .whereType<Map>()
        .map((e) => AiQualityIssue.fromJson(Map<String, dynamic>.from(e)))
        .toList();
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
      issues: issues,
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
