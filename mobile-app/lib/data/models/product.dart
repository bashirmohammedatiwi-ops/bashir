import 'dart:convert';

import '../../core/config/app_config.dart';
import '../../core/l10n/localized_text.dart';
import '../../core/utils/json.dart';
import '../../core/utils/media_url.dart';
import 'media.dart';
import 'brand.dart';
import 'category.dart';

class ProductImage {
  final String id;
  final bool isPrimary;
  final AppMedia? media;

  /// رابط مباشر بلا كائن وسائط (صورة الاقتراحات الفورية في نسخة مبدئية للمنتج).
  final String? _directUrl;

  const ProductImage({this.id = '', this.isPrimary = false, this.media, String? url}) : _directUrl = url;

  factory ProductImage.fromJson(Map<String, dynamic> json) => ProductImage(
        id: asString(json['id']),
        isPrimary: asBool(json['isPrimary']),
        media: json['media'] is Map ? AppMedia.fromJson(asMap(json['media'])) : null,
      );

  String get url {
    final thumb = media?.thumb ?? '';
    return thumb.isNotEmpty ? thumb : resolveMediaUrl(_directUrl);
  }

  String get fullUrl {
    final full = media?.full ?? '';
    return full.isNotEmpty ? full : resolveMediaUrl(_directUrl);
  }
}

class ProductShade {
  final String id;
  final String name;
  final String colorHex;
  final String? colorHexEnd;
  final String? barcode;

  /// سعر الدرجة إن اختلف عن المنتج (null = تتبع سعر المنتج).
  final int? price;

  /// السعر قبل الخصم لهذه الدرجة — له معنى فقط مع [price] الخاص بها.
  final int? originalPrice;
  final int? discountPercent;
  final int stock;
  final AppMedia? image;

  const ProductShade({
    required this.id,
    required this.name,
    required this.colorHex,
    this.colorHexEnd,
    this.barcode,
    this.price,
    this.originalPrice,
    this.discountPercent,
    this.stock = 0,
    this.image,
    this.listed = false,
  });

  factory ProductShade.fromJson(Map<String, dynamic> json) => ProductShade(
        id: asString(json['id']),
        name: asString(json['name']),
        colorHex: asString(json['colorHex'], '#CCCCCC'),
        colorHexEnd: json['colorHexEnd']?.toString(),
        barcode: json['barcode']?.toString(),
        price: json['price'] != null ? asInt(json['price']) : null,
        originalPrice: json['originalPrice'] != null ? asInt(json['originalPrice']) : null,
        discountPercent: json['discountPercent'] != null ? asInt(json['discountPercent']) : null,
        stock: asInt(json['stock']),
        image: json['image'] is Map ? AppMedia.fromJson(asMap(json['image'])) : null,
        listed: json['hasBarcode'] == true,
      );

  /// من بيانات البطاقة الخفيفة: الخادم يرسل «hasBarcode» بدل الباركود نفسه.
  final bool listed;

  bool get hasBarcode => listed || (barcode != null && barcode!.trim().isNotEmpty);
  bool get inStock => stock > 0;
}

class ProductVariant {
  final String id;
  final String label;
  final String? sizeLabel;
  final int priceDelta;
  final int stock;

  const ProductVariant({
    required this.id,
    required this.label,
    this.sizeLabel,
    this.priceDelta = 0,
    this.stock = 0,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) => ProductVariant(
        id: asString(json['id']),
        label: asString(json['label']),
        sizeLabel: json['sizeLabel']?.toString(),
        priceDelta: asInt(json['priceDelta']),
        stock: asInt(json['stock']),
      );
}

class Product {
  final String id;
  final String sku;
  final String name;
  final String? nameAr;
  final String? nameEn;
  final String slug;
  final String description;
  final String? descriptionAr;
  final String? descriptionEn;
  final String ingredients;
  final String howToUse;
  final int price;
  final int originalPrice;
  final int discountPercent;
  final double rating;
  final int reviewCount;
  final int soldCount;
  final int stock;
  final int pointsEarned;
  final bool isNew;
  final bool isBestSeller;
  final bool isFeatured;
  final bool isPromo;
  final List<String> tags;
  final Brand? brand;

  /// القسم الرئيسي (الجذر).
  final Category? category;

  /// القسم الفرعي والثالث كما يرسلهما الخادم ({id, name, nameEn, slug, parentId}).
  final Category? subcategory;
  final Category? tertiaryCategory;
  final String? subcategoryId;
  final String? tertiaryCategoryId;

  /// أنواع البشرة المناسبة (oily، dry…) — الخادم يرسلها نص JSON في القوائم وقائمة في التفاصيل.
  final List<String> skinTypes;
  final List<ProductImage> images;
  final List<ProductShade> shades;
  final List<ProductVariant> variants;
  final int shadeCount;

  const Product({
    required this.id,
    required this.sku,
    required this.name,
    this.nameAr,
    this.nameEn,
    required this.slug,
    this.description = '',
    this.descriptionAr,
    this.descriptionEn,
    this.ingredients = '',
    this.howToUse = '',
    this.price = 0,
    this.originalPrice = 0,
    this.discountPercent = 0,
    this.rating = 0,
    this.reviewCount = 0,
    this.soldCount = 0,
    this.stock = 0,
    this.pointsEarned = 0,
    this.isNew = false,
    this.isBestSeller = false,
    this.isFeatured = false,
    this.isPromo = false,
    this.tags = const [],
    this.brand,
    this.category,
    this.subcategory,
    this.tertiaryCategory,
    this.subcategoryId,
    this.tertiaryCategoryId,
    this.skinTypes = const [],
    this.images = const [],
    this.shades = const [],
    this.variants = const [],
    this.shadeCount = 0,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final count = asMap(json['_count']);
    final shades = asList(json['shades']).map(ProductShade.fromJson).toList();
    final subcategory = json['subcategory'] is Map ? Category.fromJson(asMap(json['subcategory'])) : null;
    final tertiary = json['tertiaryCategory'] is Map ? Category.fromJson(asMap(json['tertiaryCategory'])) : null;
    return Product(
      id: asString(json['id']),
      sku: asString(json['sku']),
      name: asString(json['name']),
      nameAr: json['nameAr']?.toString(),
      nameEn: json['nameEn']?.toString(),
      slug: asString(json['slug']),
      description: asString(json['description']),
      descriptionAr: json['descriptionAr']?.toString(),
      descriptionEn: json['descriptionEn']?.toString(),
      ingredients: asString(json['ingredients']),
      howToUse: asString(json['howToUse']),
      price: asInt(json['price']),
      originalPrice: asInt(json['originalPrice']),
      discountPercent: asInt(json['discountPercent']),
      rating: asDouble(json['rating']),
      reviewCount: asInt(json['reviewCount']),
      soldCount: asInt(json['soldCount']),
      stock: asInt(json['stock']),
      pointsEarned: asInt(json['pointsEarned']),
      isNew: asBool(json['isNew']),
      isBestSeller: asBool(json['isBestSeller']),
      isFeatured: asBool(json['isFeatured']),
      isPromo: asBool(json['isPromo']),
      tags: json['tags'] is List ? asStringList(json['tags']) : const [],
      brand: json['brand'] is Map ? Brand.fromJson(asMap(json['brand'])) : null,
      category: json['category'] is Map ? Category.fromJson(asMap(json['category'])) : null,
      subcategory: subcategory,
      tertiaryCategory: tertiary,
      subcategoryId: _idOrNull(json['subcategoryId']) ?? _idOrNull(subcategory?.id),
      tertiaryCategoryId: _idOrNull(json['tertiaryCategoryId']) ?? _idOrNull(tertiary?.id),
      skinTypes: _looseStringList(json['skinTypes'] ?? json['skinType']),
      images: asList(json['images']).map(ProductImage.fromJson).toList(),
      shades: shades,
      variants: asList(json['variants']).map(ProductVariant.fromJson).toList(),
      shadeCount: asInt(count['shades']) > 0 ? asInt(count['shades']) : shades.length,
    );
  }

  String get coverUrl {
    for (final img in images) {
      final url = img.url.isNotEmpty ? img.url : img.fullUrl;
      if (url.isNotEmpty) return url;
    }
    for (final shade in displayableShades) {
      final url = shade.image?.thumb ?? shade.image?.full ?? '';
      if (url.isNotEmpty) return url;
    }
    return AppConfig.productPlaceholderUrl;
  }

  String get displayCoverUrl => coverUrl;
  List<String> get galleryUrls {
    final seen = <String>{};
    final out = <String>[];
    for (final e in images) {
      final full = e.fullUrl;
      final raw = full.isNotEmpty ? full : e.url;
      if (raw.isEmpty) continue;
      final key = raw.split('?').first.trim().toLowerCase();
      if (seen.contains(key)) continue;
      seen.add(key);
      out.add(raw);
    }
    return out;
  }
  bool get inStock => stock > 0;
  bool get hasDiscount => discountPercent > 0 && originalPrice > price;

  // ─── السعر حسب الدرجة — نفس ما يحاسب عليه السيرفر ───────────────────────────
  // سعر المنتج وخصمه تجميعيان (الدرجة الرئيسية وأعلى خصم)، والدرجة قد يكون لها سعرها.

  /// سعر القطعة للدرجة المختارة (أو سعر المنتج بلا درجة / لدرجة بلا سعر خاص).
  int unitFor(ProductShade? shade) => shade?.price ?? price;

  /// السعر قبل الخصم: درجة لها سعرها تستخدم سعرها الأصلي (0 = بلا خصم)،
  /// ودرجة بلا سعر خاص ترث سعر المنتج الأصلي.
  int origFor(ProductShade? shade) => shade?.price != null ? (shade!.originalPrice ?? 0) : originalPrice;

  bool hasDiscountFor(ProductShade? shade) => origFor(shade) > unitFor(shade);

  /// نسبة الخصم الفعلية للدرجة (مقرّبة) — 0 بلا خصم.
  int pctFor(ProductShade? shade) {
    final orig = origFor(shade);
    final unit = unitFor(shade);
    if (orig <= 0 || orig <= unit) return 0;
    return ((orig - unit) * 100 / orig).round();
  }

  String localizedName(String lang) => localizedText(
        languageCode: lang,
        ar: nameAr,
        en: nameEn,
        fallback: name,
      );

  String localizedDescription(String lang) => localizedText(
        languageCode: lang,
        ar: descriptionAr,
        en: descriptionEn,
        fallback: description,
      );

  String brandNameFor(String lang) => brand?.localizedName(lang) ?? '';
  String get brandName => brand?.name ?? '';
  /// اسم البراند القصير للبطاقات (لاتيني إن وُجد — بلا خلط لغتين في سطر واحد).
  String get brandLabel => brand?.label ?? '';

  /// تدرجات لها باركود — تُعرض في التطبيق فقط.
  List<ProductShade> get displayableShades =>
      shades.where((s) => s.hasBarcode).toList(growable: false);

  /// منتج بدرجة لون واحدة فقط (يُعامل كمنتج عادي في القوائم).
  ProductShade? get soleDisplayableShade =>
      displayableShades.length == 1 ? displayableShades.first : null;

  /// أكثر من درجة — يُعرض اختيار التدرج للمستخدم.
  bool get hasMultipleDisplayableShades => displayableShades.length > 1;

  bool get hasDisplayableShades => hasMultipleDisplayableShades;

  /// الدرجة المستخدمة في السلة: المختارة أو الوحيدة إن وُجدت.
  ProductShade? shadeForCart({ProductShade? selected}) {
    if (hasMultipleDisplayableShades) return selected;
    return soleDisplayableShade ?? selected;
  }
}

String? _idOrNull(dynamic v) {
  final s = v?.toString().trim() ?? '';
  return s.isEmpty ? null : s;
}

/// قائمة نصوص من List أو نص JSON («["oily","dry"]») أو نص مفصول بفواصل.
List<String> _looseStringList(dynamic v) {
  if (v is List) return v.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList();
  final raw = v?.toString().trim() ?? '';
  if (raw.isEmpty) return const [];
  if (raw.startsWith('[')) {
    try {
      final decoded = jsonDecode(raw);
      if (decoded is List) return _looseStringList(decoded);
    } catch (_) {}
    return const [];
  }
  return raw.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
}
