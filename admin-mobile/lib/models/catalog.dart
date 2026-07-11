import '../core/utils/json.dart';

class CatalogStore {
  const CatalogStore({required this.id, required this.label});

  final String id;
  final String label;

  factory CatalogStore.fromJson(Map<String, dynamic> json) {
    return CatalogStore(
      id: asString(json['id']),
      label: asString(json['label'], asString(json['id'])),
    );
  }
}

class StoreSearchStat {
  const StoreSearchStat({
    required this.storeId,
    required this.storeLabel,
    this.count = 0,
    this.error,
    this.done = false,
  });

  final String storeId;
  final String storeLabel;
  final int count;
  final String? error;
  final bool done;

  bool get ok => error == null;
}

class CatalogBarcodeSearchResult {
  const CatalogBarcodeSearchResult({
    required this.options,
    required this.stats,
  });

  final List<CatalogImportOption> options;
  final List<StoreSearchStat> stats;
}

class CatalogImportOption {
  const CatalogImportOption({
    required this.store,
    required this.storeLabel,
    required this.sourceId,
    required this.nameAr,
    this.nameEn,
    this.brandAr,
    this.thumb,
    this.barcode,
    this.miswagId,
    this.shadeCount = 0,
    this.shadeName,
    this.price,
    this.category,
    this.matchType,
  });

  final String store;
  final String storeLabel;
  final String sourceId;
  final String nameAr;
  final String? nameEn;
  final String? brandAr;
  final String? thumb;
  final String? barcode;
  final String? miswagId;
  final int shadeCount;
  final String? shadeName;
  final String? price;
  final String? category;
  final String? matchType;

  String get key => '$store:$sourceId';

  factory CatalogImportOption.fromJson(Map<String, dynamic> json, String storeId) {
    return CatalogImportOption(
      store: asString(json['store'], storeId),
      storeLabel: asString(json['storeLabel'], asString(json['store'], storeId)),
      sourceId: asString(json['sourceId'], asString(json['id'])),
      nameAr: asString(json['nameAr'], asString(json['name'])),
      nameEn: json['nameEn']?.toString(),
      brandAr: json['brandAr']?.toString() ?? json['manufacturer']?.toString(),
      thumb: json['thumb']?.toString(),
      barcode: json['barcode']?.toString(),
      miswagId: json['miswagId']?.toString(),
      shadeCount: asInt(json['shadeCount']),
      shadeName: json['shadeName']?.toString(),
      price: json['price']?.toString(),
      category: json['category']?.toString(),
      matchType: json['matchType']?.toString() ?? 'barcode',
    );
  }
}

class CatalogImportShade {
  const CatalogImportShade({
    this.id,
    required this.name,
    this.nameAr,
    this.nameEn,
    this.barcode,
    this.colorHex,
    this.imageUrl,
    this.sku,
    this.miswagId,
    this.price,
  });

  final String? id;
  final String name;
  final String? nameAr;
  final String? nameEn;
  final String? barcode;
  final String? colorHex;
  final String? imageUrl;
  final String? sku;
  final String? miswagId;
  final String? price;

  factory CatalogImportShade.fromJson(Map<String, dynamic> json) {
    final imageUrl = json['imageUrl']?.toString() ??
        json['image']?.toString() ??
        json['thumb']?.toString() ??
        json['swatchUrl']?.toString() ??
        json['swatchImage']?.toString();
    return CatalogImportShade(
      id: json['id']?.toString() ?? json['sku']?.toString() ?? json['miswagId']?.toString(),
      name: asString(json['nameAr'], asString(json['nameEn'], asString(json['name'], 'درجة'))),
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
      barcode: json['barcode']?.toString() ?? json['ean']?.toString(),
      colorHex: json['colorHex']?.toString() ?? json['hex']?.toString() ?? json['color']?.toString(),
      imageUrl: imageUrl?.isNotEmpty == true ? imageUrl : null,
      sku: json['sku']?.toString(),
      miswagId: json['miswagId']?.toString() ?? json['sku']?.toString() ?? json['optionId']?.toString(),
      price: json['price']?.toString(),
    );
  }
}

class CatalogImportProduct {
  const CatalogImportProduct({
    required this.store,
    required this.storeLabel,
    required this.sourceId,
    required this.nameAr,
    required this.nameEn,
    required this.brandAr,
    required this.brandEn,
    required this.descriptionAr,
    required this.descriptionEn,
    this.barcode,
    required this.sku,
    required this.images,
    required this.shades,
    required this.hasShades,
    this.sourceUrl,
    this.priceHint,
    this.categoryHint,
  });

  final String store;
  final String storeLabel;
  final String sourceId;
  final String nameAr;
  final String nameEn;
  final String brandAr;
  final String brandEn;
  final String descriptionAr;
  final String descriptionEn;
  final String? barcode;
  final String sku;
  final List<CatalogImage> images;
  final List<CatalogImportShade> shades;
  final bool hasShades;
  final String? sourceUrl;
  final String? priceHint;
  final String? categoryHint;

  factory CatalogImportProduct.fromJson(Map<String, dynamic> raw, {String storeLabel = '', String storeId = ''}) {
    final shades = ((raw['shades'] as List?) ?? [])
        .map((s) => CatalogImportShade.fromJson(asMap(s)))
        .toList();

    final images = <CatalogImage>[];
    for (final img in (raw['images'] as List?) ?? []) {
      if (img is String && img.isNotEmpty) {
        images.add(CatalogImage(url: img, isPrimary: images.isEmpty));
        continue;
      }
      final m = asMap(img);
      final url = m['url']?.toString();
      if (url != null && url.isNotEmpty) {
        images.add(CatalogImage(url: url, isPrimary: images.isEmpty));
      }
    }
    if (images.isEmpty && raw['thumb'] != null) {
      images.add(CatalogImage(url: raw['thumb'].toString(), isPrimary: true));
    }

    final shadeCount = asInt(raw['shadeCount'], shades.length);

    return CatalogImportProduct(
      store: asString(raw['sourceStore'], asString(raw['store'], storeId)),
      storeLabel: storeLabel.isNotEmpty ? storeLabel : asString(raw['storeLabel']),
      sourceId: asString(raw['sourceId'], asString(raw['id'])),
      nameAr: asString(raw['nameAr'], asString(raw['name'])),
      nameEn: asString(raw['nameEn']),
      brandAr: asString(raw['brandAr'], asString(raw['manufacturer'])),
      brandEn: asString(raw['brandEn'], asString(raw['manufacturerEn'])),
      descriptionAr: asString(raw['descriptionAr'], asString(raw['description'])),
      descriptionEn: asString(raw['descriptionEn']),
      barcode: raw['barcode']?.toString(),
      sku: asString(raw['sourceSku'], asString(raw['sku'], asString(raw['sourceId'], asString(raw['id'])))),
      images: images,
      shades: shades,
      hasShades: shades.length > 1 || raw['hasOptions'] == true || shadeCount > 1,
      sourceUrl: raw['productUrl']?.toString() ?? raw['sourceUrl']?.toString(),
      priceHint: raw['price']?.toString() ?? raw['priceHint']?.toString(),
      categoryHint: raw['category']?.toString() ?? raw['categoryHint']?.toString(),
    );
  }

  CatalogImportProduct copyWith({
    List<CatalogImportShade>? shades,
    bool? hasShades,
    String? nameAr,
    String? nameEn,
    String? priceHint,
  }) {
    return CatalogImportProduct(
      store: store,
      storeLabel: storeLabel,
      sourceId: sourceId,
      nameAr: nameAr ?? this.nameAr,
      nameEn: nameEn ?? this.nameEn,
      brandAr: brandAr,
      brandEn: brandEn,
      descriptionAr: descriptionAr,
      descriptionEn: descriptionEn,
      barcode: barcode,
      sku: sku,
      images: images,
      shades: shades ?? this.shades,
      hasShades: hasShades ?? this.hasShades,
      sourceUrl: sourceUrl,
      priceHint: priceHint ?? this.priceHint,
      categoryHint: categoryHint,
    );
  }
}

class CatalogImage {
  const CatalogImage({required this.url, this.isPrimary = false});
  final String url;
  final bool isPrimary;
}

class NamedEntity {
  const NamedEntity({required this.id, this.nameAr, this.nameEn, this.name, this.parentId});
  final String id;
  final String? nameAr;
  final String? nameEn;
  final String? name;
  final String? parentId;

  String get displayName => nameAr?.trim().isNotEmpty == true
      ? nameAr!
      : (nameEn?.trim().isNotEmpty == true ? nameEn! : (name ?? id));

  List<String> get searchTokens => [displayName, nameAr, nameEn, name]
      .whereType<String>()
      .map((s) => s.trim())
      .where((s) => s.isNotEmpty)
      .toList();

  factory NamedEntity.fromJson(Map<String, dynamic> json) {
    return NamedEntity(
      id: json['id']?.toString() ?? '',
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
      name: json['name']?.toString(),
      parentId: json['parentId']?.toString() ?? json['categoryId']?.toString(),
    );
  }
}
