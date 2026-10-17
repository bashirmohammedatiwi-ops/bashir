import 'dart:ui';

import '../core/format.dart';

Color? hexColor(String? hex) {
  if (hex == null) return null;
  var h = hex.trim().replaceAll('#', '');
  if (h.length == 3) h = h.split('').map((c) => '$c$c').join();
  if (h.length != 6) return null;
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(0xFF000000 | v);
}

int _int(dynamic v) => v is num ? v.toInt() : int.tryParse('$v') ?? 0;
int? _intN(dynamic v) => v == null ? null : (v is num ? v.toInt() : int.tryParse('$v'));
String? _str(dynamic v) => v?.toString();
List<Map<String, dynamic>> _list(dynamic v) => v is List ? v.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList() : const [];

class NamedRef {
  NamedRef(this.id, this.name);
  final String id;
  final String name;
  static NamedRef? from(dynamic j) => j is Map ? NamedRef('${j['id']}', '${j['nameAr'] ?? j['name'] ?? ''}') : null;
}

class ShadeDot {
  ShadeDot(this.colorHex, this.colorHexEnd, this.isActive);
  final String? colorHex;
  final String? colorHexEnd;
  final bool isActive;
}

class MatchedShade {
  MatchedShade.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      name = '${j['name']}',
      barcode = _str(j['barcode']),
      isActive = j['isActive'] != false,
      colorHex = _str(j['colorHex']),
      colorHexEnd = _str(j['colorHexEnd']),
      stock = _int(j['stock']);
  final String id;
  final String name;
  final String? barcode;
  bool isActive;
  final String? colorHex;
  final String? colorHexEnd;
  final int stock;
}

class ProductSummary {
  ProductSummary.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      slug = _str(j['slug']),
      sku = _str(j['sku']),
      barcode = _str(j['barcode']),
      name = '${j['name'] ?? ''}',
      nameEn = _str(j['nameEn']),
      isActive = j['isActive'] != false,
      price = _int(j['price']),
      originalPrice = _int(j['originalPrice']),
      discountPercent = _int(j['discountPercent']),
      stock = _int(j['stock']),
      brand = NamedRef.from(j['brand']),
      category = NamedRef.from(j['category']),
      thumb = _str(j['thumb']),
      imageCount = _int(j['imageCount']),
      shadeCount = _int(j['shadeCount']),
      shadesOff = _int(j['shadesOff']),
      exactBarcode = j['exactBarcode'] == true,
      updatedAt = parseDate(j['updatedAt']),
      shadePreview = _list(
        j['shadePreview'],
      ).map((s) => ShadeDot(_str(s['colorHex']), _str(s['colorHexEnd']), s['isActive'] != false)).toList(),
      matchedShades = _list(j['matchedShades']).map(MatchedShade.fromJson).toList();

  final String id;
  final String? slug;
  final String? sku;
  final String? barcode;
  final String name;
  final String? nameEn;
  bool isActive;
  final int price;
  final int originalPrice;
  final int discountPercent;
  final int stock;
  final NamedRef? brand;
  final NamedRef? category;
  final String? thumb;
  final int imageCount;
  final int shadeCount;
  final int shadesOff;
  final bool exactBarcode;
  final DateTime? updatedAt;
  final List<ShadeDot> shadePreview;
  final List<MatchedShade> matchedShades;
}

class MediaImage {
  MediaImage.fromJson(Map<String, dynamic> j)
    : mediaId = '${j['mediaId']}',
      url = _str(j['url']),
      large = _str(j['large']),
      thumb = _str(j['thumb']),
      width = _intN(j['width']),
      height = _intN(j['height']),
      bytes = _intN(j['bytes']);
  final String mediaId;
  final String? url;
  final String? large;
  final String? thumb;
  final int? width;
  final int? height;
  final int? bytes;

  String? get best => large ?? url ?? thumb;
  String get sizeLabel => width != null && height != null ? '$width×$height' : '';
}

class PosInfo {
  PosInfo.fromJson(Map<String, dynamic> j)
    : name = _str(j['name']),
      price = _intN(j['price']),
      stock = _intN(j['stock']),
      syncedAt = parseDate(j['syncedAt']);
  final String? name;
  final int? price;
  final int? stock;
  final DateTime? syncedAt;
  static PosInfo? from(dynamic j) => j is Map ? PosInfo.fromJson(Map<String, dynamic>.from(j)) : null;
}

class Shade {
  Shade.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      name = '${j['name'] ?? ''}',
      colorHex = _str(j['colorHex']),
      colorHexEnd = _str(j['colorHexEnd']),
      barcode = _str(j['barcode']),
      isActive = j['isActive'] != false,
      stock = _int(j['stock']),
      price = _intN(j['price']),
      position = _int(j['position']),
      pos = PosInfo.from(j['pos']),
      image = j['image'] is Map ? MediaImage.fromJson(Map<String, dynamic>.from(j['image'])) : null;
  final String id;
  final String name;
  final String? colorHex;
  final String? colorHexEnd;
  final String? barcode;
  bool isActive;
  final int stock;
  final int? price;
  final int position;
  final PosInfo? pos;
  final MediaImage? image;
}

class ProductDetail {
  ProductDetail.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      slug = _str(j['slug']),
      sku = _str(j['sku']),
      barcode = _str(j['barcode']),
      name = '${j['name'] ?? ''}',
      nameAr = _str(j['nameAr']),
      nameEn = _str(j['nameEn']),
      descriptionAr = _str(j['descriptionAr']) ?? _str(j['description']),
      descriptionEn = _str(j['descriptionEn']),
      howToUse = _str(j['howToUse']),
      ingredients = _str(j['ingredients']),
      isActive = j['isActive'] != false,
      isNew = j['isNew'] == true,
      isBestSeller = j['isBestSeller'] == true,
      isFeatured = j['isFeatured'] == true,
      isPromo = j['isPromo'] == true,
      price = _int(j['price']),
      originalPrice = _int(j['originalPrice']),
      discountPercent = _int(j['discountPercent']),
      stock = _int(j['stock']),
      soldCount = _int(j['soldCount']),
      brand = NamedRef.from(j['brand']),
      category = NamedRef.from(j['category']),
      subcategory = NamedRef.from(j['subcategory']),
      pos = PosInfo.from(j['pos']),
      createdAt = parseDate(j['createdAt']),
      updatedAt = parseDate(j['updatedAt']),
      images = _list(j['images']).map(MediaImage.fromJson).toList(),
      shades = _list(j['shades']).map(Shade.fromJson).toList();

  final String id;
  final String? slug;
  final String? sku;
  final String? barcode;
  final String name;
  final String? nameAr;
  final String? nameEn;
  final String? descriptionAr;
  final String? descriptionEn;
  final String? howToUse;
  final String? ingredients;
  final bool isActive;
  final bool isNew;
  final bool isBestSeller;
  final bool isFeatured;
  final bool isPromo;
  final int price;
  final int originalPrice;
  final int discountPercent;
  final int stock;
  final int soldCount;
  final NamedRef? brand;
  final NamedRef? category;
  final NamedRef? subcategory;
  final PosInfo? pos;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final List<MediaImage> images;
  final List<Shade> shades;

  int get shadesOff => shades.where((s) => !s.isActive).length;
  String? get cover => images.isEmpty ? null : images.first.thumb;
}

class LookupResult {
  LookupResult.fromJson(Map<String, dynamic> j)
    : code = '${j['code']}',
      found = j['found'] == true,
      matchedShadeId = _str(j['matchedShadeId']),
      product = j['product'] is Map ? ProductDetail.fromJson(Map<String, dynamic>.from(j['product'])) : null,
      pos = PosInfo.from(j['pos']),
      drafts = _list(j['drafts']).map((d) => DraftRef.fromJson(d)).toList();
  LookupResult._copy(LookupResult r, ProductDetail p)
    : code = r.code,
      found = true,
      matchedShadeId = r.matchedShadeId,
      product = p,
      pos = r.pos,
      drafts = r.drafts;

  /// نفس النتيجة بعد تعديل المنتج (تشغيل/إيقاف من قائمة المسح).
  LookupResult withProduct(ProductDetail p) => LookupResult._copy(this, p);

  final String code;
  final bool found;
  final String? matchedShadeId;
  final ProductDetail? product;
  final PosInfo? pos;
  final List<DraftRef> drafts;
}

class DraftRef {
  DraftRef.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      name = _str(j['name']),
      groupId = '${(j['group'] as Map?)?['id'] ?? ''}',
      groupName = '${(j['group'] as Map?)?['name'] ?? ''}',
      groupColor = _str((j['group'] as Map?)?['color']);
  final String id;
  final String? name;
  final String groupId;
  final String groupName;
  final String? groupColor;
}

class Stats {
  Stats.fromJson(Map<String, dynamic> j)
    : total = _int((j['products'] as Map?)?['total']),
      active = _int((j['products'] as Map?)?['active']),
      inactive = _int((j['products'] as Map?)?['inactive']),
      noImages = _int((j['products'] as Map?)?['noImages']),
      outOfStock = _int((j['products'] as Map?)?['outOfStock']),
      shadesOff = _int((j['products'] as Map?)?['shadesOff']),
      productsWithShadesOff = _int((j['products'] as Map?)?['productsWithShadesOff']),
      draftsPending = _int((j['drafts'] as Map?)?['pending']),
      draftsAdded = _int((j['drafts'] as Map?)?['added']),
      groups = _int((j['drafts'] as Map?)?['groups']);
  final int total, active, inactive, noImages, outOfStock, shadesOff, productsWithShadesOff;
  final int draftsPending, draftsAdded, groups;
}

class DraftGroup {
  DraftGroup.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      name = '${j['name'] ?? ''}',
      color = '${j['color'] ?? 'violet'}',
      note = _str(j['note']),
      isArchived = j['isArchived'] == true,
      total = _int(j['total']),
      added = _int(j['added']),
      pending = _int(j['pending']),
      lastDraftAt = parseDate(j['lastDraftAt']),
      covers = (j['covers'] as List? ?? const []).map((e) => '$e').toList();
  final String id;
  final String name;
  final String color;
  final String? note;
  final bool isArchived;
  final int total, added, pending;
  final DateTime? lastDraftAt;
  final List<String> covers;
  double get progress => total == 0 ? 0 : added / total;
}

class Draft {
  Draft.fromJson(Map<String, dynamic> j)
    : id = '${j['id']}',
      groupId = '${j['groupId']}',
      groupName = '${(j['group'] as Map?)?['name'] ?? ''}',
      groupColor = _str((j['group'] as Map?)?['color']),
      barcode = '${j['barcode']}',
      name = _str(j['name']),
      note = _str(j['note']),
      quantity = _intN(j['quantity']),
      added = j['status'] == 'added',
      addedAt = parseDate(j['addedAt']),
      createdAt = parseDate(j['createdAt']),
      createdBy = _str(j['createdBy']),
      images = _list(j['images']).map(MediaImage.fromJson).toList(),
      pos = PosInfo.from(j['pos']),
      productId = _str((j['product'] as Map?)?['id']),
      productName = _str((j['product'] as Map?)?['name']),
      productThumb = _str((j['product'] as Map?)?['thumb']),
      productActive = (j['product'] as Map?)?['isActive'] != false;
  final String id;
  final String groupId;
  final String groupName;
  final String? groupColor;
  final String barcode;
  final String? name;
  final String? note;
  final int? quantity;
  final bool added;
  final DateTime? addedAt;
  final DateTime? createdAt;
  final String? createdBy;
  final List<MediaImage> images;
  final PosInfo? pos;
  final String? productId;
  final String? productName;
  final String? productThumb;
  final bool productActive;

  String get title => (name?.trim().isNotEmpty ?? false) ? name!.trim() : 'باركود $barcode';
}

class ActivityItem {
  ActivityItem.fromJson(Map<String, dynamic> j)
    : action = '${j['action']}',
      entityId = _str(j['entityId']),
      meta = j['meta'] is Map ? Map<String, dynamic>.from(j['meta']) : const {},
      actor = _str(j['actor']),
      at = parseDate(j['createdAt']);
  final String action;
  final String? entityId;
  final Map<String, dynamic> meta;
  final String? actor;
  final DateTime? at;

  String get label {
    switch (action) {
      case 'product.patch':
        if (meta['isActive'] == true) return 'تشغيل منتج';
        if (meta['isActive'] == false) return 'إيقاف منتج';
        return 'تعديل بيانات منتج';
      case 'shade.patch':
        if (meta['isActive'] == true) return 'تشغيل تدرج';
        if (meta['isActive'] == false) return 'إيقاف تدرج';
        return 'تعديل تدرج';
      case 'shade.bulk':
        return meta['isActive'] == true ? 'تشغيل كل التدرجات' : 'إيقاف كل التدرجات';
      case 'images.add':
        return 'إضافة صور';
      case 'images.set':
        return 'ترتيب الصور';
      case 'images.remove':
        return 'حذف صورة';
      case 'images.replace':
        return 'استبدال صورة';
      case 'images.edit':
        return 'قص/تعديل صورة';
      case 'images.batchFrame':
        return 'تأطير كل الصور';
      case 'draft.save':
        return 'حفظ باركود ناقص';
      default:
        return action;
    }
  }
}

class PageResult<T> {
  PageResult(this.items, this.total, this.hasNext);
  final List<T> items;
  final int total;
  final bool hasNext;
}
