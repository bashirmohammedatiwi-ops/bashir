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
    this.reviewNotes,
    this.sourceUrl,
    this.model,
    this.usedWebSearch = false,
  });

  final String barcode;
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

  factory AiAutofillResult.fromJson(Map<String, dynamic> json) {
    final images = (json['images'] as List? ?? [])
        .map((e) => AiAutofillImage.fromJson(Map<String, dynamic>.from(e as Map)))
        .where((i) => i.url.isNotEmpty)
        .toList();
    final meta = json['meta'] is Map ? Map<String, dynamic>.from(json['meta'] as Map) : <String, dynamic>{};
    return AiAutofillResult(
      barcode: json['barcode']?.toString() ?? '',
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
    );
  }
}
