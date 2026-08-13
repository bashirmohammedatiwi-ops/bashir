import '../core/utils/media_url.dart';

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
    this.subcategoryIds = const [],
    this.tertiaryCategoryIds = const [],
    this.categoryNameAr,
    this.subcategoryNameAr,
    this.tertiaryNameAr,
    this.subcategoryNamesAr = const [],
    this.tertiaryNamesAr = const [],
  });

  final String? categoryId;
  final String? subcategoryId;
  final String? tertiaryCategoryId;
  final List<String> subcategoryIds;
  final List<String> tertiaryCategoryIds;
  final String? categoryNameAr;
  final String? subcategoryNameAr;
  final String? tertiaryNameAr;
  final List<String> subcategoryNamesAr;
  final List<String> tertiaryNamesAr;

  factory AiAutofillCategory.fromJson(Map<String, dynamic> json) {
    List<String> ids(dynamic v) {
      if (v is! List) return [];
      return v.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).toList();
    }

    List<String> names(dynamic v) {
      if (v is! List) return [];
      return v.map((e) => e?.toString().trim() ?? '').where((s) => s.isNotEmpty).toList();
    }

    final subIds = ids(json['subcategoryIds']);
    final tertIds = ids(json['tertiaryCategoryIds']);
    final subSingle = json['subcategoryId']?.toString();
    final tertSingle = json['tertiaryCategoryId']?.toString();

    return AiAutofillCategory(
      categoryId: json['categoryId']?.toString(),
      subcategoryId: subSingle,
      tertiaryCategoryId: tertSingle,
      subcategoryIds: subIds.isNotEmpty
          ? subIds
          : (subSingle != null && subSingle.isNotEmpty ? [subSingle] : const []),
      tertiaryCategoryIds: tertIds.isNotEmpty
          ? tertIds
          : (tertSingle != null && tertSingle.isNotEmpty ? [tertSingle] : const []),
      categoryNameAr: json['categoryNameAr']?.toString(),
      subcategoryNameAr: json['subcategoryNameAr']?.toString(),
      tertiaryNameAr: json['tertiaryNameAr']?.toString(),
      subcategoryNamesAr: names(json['subcategoryNamesAr']),
      tertiaryNamesAr: names(json['tertiaryNamesAr']),
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
        final map = Map<String, dynamic>.from(row);
        final url = resolveProductImageUrl(map, prefer: 'thumb') ??
            resolveProductImageUrl(map, prefer: 'medium');
        if (url == null || url.isEmpty) continue;
        imageUrls.add(url);
        thumb ??= url;
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
    this.modelChoice,
    this.usedWebSearch = false,
    this.namesVerified = false,
    this.namingSource,
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
  final String? modelChoice;
  final bool usedWebSearch;
  final bool namesVerified;
  final String? namingSource;
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
      modelChoice: meta['modelChoice']?.toString(),
      usedWebSearch: meta['usedWebSearch'] == true,
      namesVerified: meta['namesVerified'] == true,
      namingSource: meta['namingSource']?.toString(),
      imageQuery: meta['imageQuery']?.toString(),
      aiSkipped: meta['aiSkipped'] == true,
      issues: issues,
    );
  }
}

class ShadeFamilyExistingHit {
  const ShadeFamilyExistingHit({
    required this.barcode,
    required this.productId,
    this.nameAr,
    this.nameEn,
    this.matchedShadeName,
  });

  final String barcode;
  final String productId;
  final String? nameAr;
  final String? nameEn;
  final String? matchedShadeName;

  factory ShadeFamilyExistingHit.fromJson(Map<String, dynamic> json) {
    return ShadeFamilyExistingHit(
      barcode: json['barcode']?.toString() ?? '',
      productId: json['productId']?.toString() ?? json['id']?.toString() ?? '',
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
      matchedShadeName: json['matchedShadeName']?.toString(),
    );
  }
}

class ShadeFamilyShade {
  const ShadeFamilyShade({
    required this.barcode,
    required this.code,
    required this.name,
    required this.nameEn,
    required this.nameAr,
    required this.colorHex,
    required this.position,
  });

  final String barcode;
  final String code;
  final String name;
  final String nameEn;
  final String nameAr;
  final String colorHex;
  final int position;

  factory ShadeFamilyShade.fromJson(Map<String, dynamic> json) {
    return ShadeFamilyShade(
      barcode: json['barcode']?.toString() ?? '',
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      nameEn: json['nameEn']?.toString() ?? json['name']?.toString() ?? '',
      nameAr: json['nameAr']?.toString() ?? json['name']?.toString() ?? '',
      colorHex: json['colorHex']?.toString() ?? '#CCCCCC',
      position: int.tryParse('${json['position'] ?? 0}') ?? 0,
    );
  }
}

class ShadeFamilyResult {
  const ShadeFamilyResult({
    required this.barcodes,
    required this.brandAr,
    required this.brandEn,
    required this.nameAr,
    required this.nameEn,
    required this.descriptionAr,
    required this.descriptionEn,
    required this.category,
    required this.confidence,
    required this.needsReview,
    required this.shades,
    required this.images,
    this.productTypeAr = '',
    this.existingHits = const [],
    this.model,
    this.modelChoice,
    this.usedWebSearch = false,
    this.namesVerified = false,
    this.namingSource,
    this.isFallback = false,
    this.imageCount = 0,
  });

  final List<String> barcodes;
  final String brandAr;
  final String brandEn;
  final String nameAr;
  final String nameEn;
  final String descriptionAr;
  final String descriptionEn;
  final String productTypeAr;
  final AiAutofillCategory category;
  final num confidence;
  final bool needsReview;
  final List<ShadeFamilyShade> shades;
  final List<AiAutofillImage> images;
  final List<ShadeFamilyExistingHit> existingHits;
  final String? model;
  final String? modelChoice;
  final bool usedWebSearch;
  final bool namesVerified;
  final String? namingSource;
  final bool isFallback;
  final int imageCount;

  factory ShadeFamilyResult.fromJson(Map<String, dynamic> json) {
    final images = (json['images'] as List? ?? [])
        .whereType<Map>()
        .map((e) => AiAutofillImage.fromJson(Map<String, dynamic>.from(e)))
        .where((i) => i.url.isNotEmpty)
        .toList();
    final shades = (json['shades'] as List? ?? [])
        .whereType<Map>()
        .map((e) => ShadeFamilyShade.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    final hits = (json['existingHits'] as List? ?? [])
        .whereType<Map>()
        .map((e) => ShadeFamilyExistingHit.fromJson(Map<String, dynamic>.from(e)))
        .toList();
    final meta = json['meta'] is Map ? Map<String, dynamic>.from(json['meta'] as Map) : <String, dynamic>{};
    final barcodes = (json['barcodes'] as List? ?? [])
        .map((e) => e?.toString() ?? '')
        .where((s) => s.isNotEmpty)
        .toList();
    return ShadeFamilyResult(
      barcodes: barcodes,
      brandAr: json['brandAr']?.toString() ?? '',
      brandEn: json['brandEn']?.toString() ?? '',
      nameAr: json['nameAr']?.toString() ?? '',
      nameEn: json['nameEn']?.toString() ?? '',
      descriptionAr: json['descriptionAr']?.toString() ?? '',
      descriptionEn: json['descriptionEn']?.toString() ?? '',
      productTypeAr: json['productTypeAr']?.toString() ?? '',
      category: AiAutofillCategory.fromJson(Map<String, dynamic>.from((json['category'] as Map?) ?? {})),
      confidence: json['confidence'] as num? ?? 0,
      needsReview: json['needsReview'] == true,
      shades: shades,
      images: images,
      existingHits: hits,
      model: meta['model']?.toString(),
      modelChoice: meta['modelChoice']?.toString(),
      usedWebSearch: meta['usedWebSearch'] == true,
      namesVerified: meta['namesVerified'] == true,
      namingSource: meta['namingSource']?.toString(),
      isFallback: meta['fallback'] == true || meta['namingSource']?.toString() == 'fallback',
      imageCount: int.tryParse('${meta['imageCount'] ?? images.length}') ?? images.length,
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
