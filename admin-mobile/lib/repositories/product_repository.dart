import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/api_client.dart';
import '../core/utils/api_error.dart';
import '../core/utils/helpers.dart';
import '../core/utils/json.dart';
import '../models/brand.dart';
import '../models/catalog.dart';
import '../models/inventory.dart';

class CategoryMatch {
  const CategoryMatch({this.categoryId, this.subcategoryId, this.tertiaryCategoryId});
  final String? categoryId;
  final String? subcategoryId;
  final String? tertiaryCategoryId;
}

class ProductRepository {
  ProductRepository(this._dio);

  final Dio _dio;

  Future<List<BrandEntity>> brands() async {
    final resp = await _dio.get('/brands', queryParameters: {'all': 1});
    final data = resp.data['data'] ?? resp.data;
    return (data as List).map((e) => BrandEntity.fromJson(asMap(e))).toList();
  }

  Future<List<NamedEntity>> categories() async {
    final resp = await _dio.get('/categories', queryParameters: {'all': 1, 'minimal': 1});
    final data = resp.data['data'] ?? resp.data;
    return (data as List).map((e) => NamedEntity.fromJson(asMap(e))).toList();
  }

  Future<List<NamedEntity>> subcategories({String? parentId}) async {
    final resp = await _dio.get('/subcategories', queryParameters: {'all': 1, if (parentId != null) 'parentId': parentId});
    final data = resp.data['data'] ?? resp.data;
    return (data as List).map((e) => NamedEntity.fromJson(asMap(e))).toList();
  }

  Future<List<NamedEntity>> tertiarySections({String? parentId}) async {
    final resp = await _dio.get('/tertiary-sections', queryParameters: {'all': 1, if (parentId != null) 'parentId': parentId});
    final data = resp.data['data'] ?? resp.data;
    return (data as List).map((e) => NamedEntity.fromJson(asMap(e))).toList();
  }

  Future<String?> resolveBrand({
    String? brandAr,
    String? brandEn,
    String? logoUrl,
    bool createIfMissing = true,
  }) async {
    final resp = await _dio.post('/brands/resolve', data: {
      if (brandAr != null && brandAr.isNotEmpty) 'brandAr': brandAr,
      if (brandEn != null && brandEn.isNotEmpty) 'brandEn': brandEn,
      if (logoUrl != null) 'logoUrl': logoUrl,
      'createIfMissing': createIfMissing,
    });
    final data = asMap(resp.data['data'] ?? resp.data);
    return data['brand']?['id']?.toString() ?? data['id']?.toString();
  }

  Future<Map<String, BarcodeInventoryLookup>> lookupBarcodes(List<String> barcodes) async {
    final normalized = barcodes.map(normalizeBarcode).where((b) => b.isNotEmpty).toSet().toList();
    if (normalized.isEmpty) return {};

    final resp = await _dio.post('/sync/inventory/lookup-barcodes', data: {'barcodes': normalized});
    final body = asMap(resp.data['data'] ?? resp.data);
    final items = asMap(body['items']);
    return items.map((k, v) => MapEntry(k, BarcodeInventoryLookup.fromJson(k, asMap(v))));
  }

  Future<String?> uploadImageFromUrl(String url, {String purpose = 'PRODUCT'}) async {
    final resp = await _dio.post(
      '/media/upload-from-url',
      data: {'url': url.trim(), 'purpose': purpose},
      options: Options(receiveTimeout: const Duration(seconds: 120)),
    );
    final data = asMap(resp.data['data'] ?? resp.data);
    return data['id']?.toString();
  }

  Future<Map<String, dynamic>> createProduct(Map<String, dynamic> payload) async {
    try {
      final resp = await _dio.post('/products', data: payload);
      return asMap(resp.data['data'] ?? resp.data);
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل إنشاء المنتج'));
    }
  }

  CategoryMatch matchCategoryFromHints(
    List<NamedEntity> categories,
    List<NamedEntity> subcategories,
    List<NamedEntity> tertiary,
    String hintAr,
    String hintEn,
  ) {
    String norm(String s) => s.toLowerCase().replaceAll(RegExp(r'[^\w\s\u0600-\u06FF]'), ' ').replaceAll(RegExp(r'\s+'), ' ').trim();

    int scoreName(String hint, NamedEntity entity) {
      final h = norm(hint);
      if (h.isEmpty) return 0;
      final candidates = [entity.nameAr, entity.nameEn, entity.name].whereType<String>().map(norm).where((c) => c.isNotEmpty);
      var best = 0;
      for (final c in candidates) {
        if (h == c) {
          best = best > 100 ? best : 100;
        } else if (h.contains(c) || c.contains(h)) {
          best = best > 70 ? best : 70;
        }
      }
      return best;
    }

    NamedEntity? bestOf(List<NamedEntity> list, int minScore, {String? parentId}) {
      final parts = '$hintAr › $hintEn'.split(RegExp(r'[›>／/|»«]+')).map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
      final deepest = parts.isNotEmpty ? parts.last : (hintAr.isNotEmpty ? hintAr : hintEn);

      String? bestId;
      var bestScore = 0;
      for (final entity in list) {
        if (parentId != null && entity.parentId != null && entity.parentId != parentId) continue;
        final score = parts.map((p) => scoreName(p, entity)).fold(0, (a, b) => a > b ? a : b);
        final s = score > scoreName(deepest, entity) ? score : scoreName(deepest, entity);
        if (s >= minScore && s > bestScore) {
          bestScore = s;
          bestId = entity.id;
        }
      }
      if (bestId == null) return null;
      return list.firstWhere((e) => e.id == bestId);
    }

    final cat = bestOf(categories, 40);
    final sub = cat != null ? bestOf(subcategories, 50, parentId: cat.id) : null;
    final tert = sub != null ? bestOf(tertiary, 50, parentId: sub.id) : null;

    return CategoryMatch(
      categoryId: cat?.id,
      subcategoryId: sub?.id,
      tertiaryCategoryId: tert?.id,
    );
  }

  /// يتأكد أن التصنيفات الفرعية تتبع الأب الصحيح قبل الإرسال للسيرفر.
  Future<({String? subcategoryId, String? tertiaryCategoryId})> sanitizeCategoryHierarchy({
    required String categoryId,
    String? subcategoryId,
    String? tertiaryCategoryId,
  }) async {
    String? sub = subcategoryId;
    String? tert = tertiaryCategoryId;

    if (sub != null) {
      final subs = await subcategories(parentId: categoryId);
      if (!subs.any((s) => s.id == sub)) sub = null;
    }

    if (tert != null) {
      if (sub == null) {
        tert = null;
      } else {
        final sections = await tertiarySections(parentId: sub);
        if (!sections.any((t) => t.id == tert)) tert = null;
      }
    }

    return (subcategoryId: sub, tertiaryCategoryId: tert);
  }

  Map<String, dynamic> _shadePayload(CatalogImportShade s, int index, Map<String, String> urlToId, BarcodePosSnapshot? inv) {
    final shadeBc = _validBarcode(s.barcode);
    return {
      'name': (s.nameAr ?? s.nameEn ?? s.name).trim().isEmpty ? 'درجة ${index + 1}' : (s.nameAr ?? s.nameEn ?? s.name).trim(),
      'colorHex': normalizeColorHex(s.colorHex),
      'position': index,
      if (shadeBc != null) 'barcode': shadeBc,
      if (s.imageUrl != null && urlToId[s.imageUrl] != null) 'imageId': urlToId[s.imageUrl],
      if (inv != null) ...{
        'price': toIntPrice(inv.price),
        'originalPrice': toIntPrice(inv.originalPrice),
        'discountPercent': toIntPrice(inv.discountPercent),
        'stock': toIntPrice(inv.stock),
      },
    };
  }

  Future<Map<String, dynamic>> importCatalogProduct({
    required CatalogImportProduct preview,
    required String brandId,
    String? selectedBarcode,
    String? categoryId,
    String? subcategoryId,
    String? tertiaryCategoryId,
    void Function(String stage, int done, int total)? onProgress,
  }) async {
    if (brandId.isEmpty) {
      throw Exception('اختر البراند');
    }
    if (categoryId == null || categoryId.isEmpty) {
      throw Exception('اختر القسم الرئيسي');
    }

    final sanitized = await sanitizeCategoryHierarchy(
      categoryId: categoryId,
      subcategoryId: subcategoryId,
      tertiaryCategoryId: tertiaryCategoryId,
    );
    final safeSub = sanitized.subcategoryId;
    final safeTert = sanitized.tertiaryCategoryId;

    final imageUrls = <String>[];
    for (final img in preview.images) {
      if (img.url.isNotEmpty) imageUrls.add(img.url);
    }
    for (final shade in preview.shades) {
      if (shade.imageUrl != null && shade.imageUrl!.isNotEmpty) {
        imageUrls.add(shade.imageUrl!);
      }
    }
    final uniqueUrls = imageUrls.toSet().toList();
    final urlToId = <String, String>{};
    var done = 0;
    for (final url in uniqueUrls) {
      onProgress?.call('رفع الصور', done, uniqueUrls.length);
      try {
        final id = await uploadImageFromUrl(url);
        if (id != null) urlToId[url] = id;
      } catch (_) {}
      done += 1;
    }

    final productImageIds = <String>[];
    for (final img in preview.images) {
      final id = urlToId[img.url];
      if (id != null && !productImageIds.contains(id)) productImageIds.add(id);
    }
    if (productImageIds.isEmpty && preview.images.isNotEmpty) {
      throw Exception('تعذّر رفع صور المنتج');
    }

    final barcodesToLookup = <String>[];
    final mainBc = _validBarcode(preview.barcode) ?? _validBarcode(selectedBarcode);
    if (mainBc != null) barcodesToLookup.add(mainBc);
    for (final s in preview.shades) {
      final bc = _validBarcode(s.barcode);
      if (bc != null) barcodesToLookup.add(bc);
    }
    final invMap = await lookupBarcodes(barcodesToLookup);

    final shades = <Map<String, dynamic>>[];
    for (var i = 0; i < preview.shades.length; i++) {
      final s = preview.shades[i];
      final shadeBc = _validBarcode(s.barcode);
      final inv = shadeBc != null ? _resolveInv(shadeBc, invMap) : null;
      shades.add(_shadePayload(s, i, urlToId, inv));
    }

    var price = 0;
    var originalPrice = 0;
    var discountPercent = 0;
    var stock = 0;

    if (mainBc != null && shades.isEmpty) {
      final inv = _resolveInv(mainBc, invMap);
      if (inv != null) {
        price = toIntPrice(inv.price);
        originalPrice = toIntPrice(inv.originalPrice);
        discountPercent = toIntPrice(inv.discountPercent);
        stock = toIntPrice(inv.stock);
      }
    }
    if (shades.isNotEmpty) {
      final lead = shades.firstWhere((s) => s['price'] != null, orElse: () => shades.first);
      price = (lead['price'] as int?) ?? 0;
      originalPrice = (lead['originalPrice'] as int?) ?? 0;
      discountPercent = (lead['discountPercent'] as int?) ?? 0;
      stock = shades.fold<int>(0, (sum, s) => sum + ((s['stock'] as int?) ?? 0));
    }

    final nameAr = preview.nameAr.trim();
    final nameEn = preview.nameEn.trim();
    final payload = {
      'sku': preview.sku.isNotEmpty ? preview.sku : 'CAT-${preview.store}-${preview.sourceId}',
      if (mainBc != null) 'barcode': mainBc,
      'name': nameAr.isNotEmpty ? nameAr : nameEn,
      if (nameAr.isNotEmpty) 'nameAr': nameAr,
      if (nameEn.isNotEmpty) 'nameEn': nameEn,
      'slug': slugify(nameAr.isNotEmpty ? nameAr : nameEn, 'product'),
      'brandId': brandId,
      'categoryId': categoryId,
      if (safeSub != null) 'subcategoryId': safeSub,
      if (safeTert != null) 'tertiaryCategoryId': safeTert,
      'description': stripHtml(preview.descriptionAr).isNotEmpty ? stripHtml(preview.descriptionAr) : stripHtml(preview.descriptionEn),
      if (stripHtml(preview.descriptionAr).isNotEmpty) 'descriptionAr': stripHtml(preview.descriptionAr),
      if (stripHtml(preview.descriptionEn).isNotEmpty) 'descriptionEn': stripHtml(preview.descriptionEn),
      'ingredients': '',
      'howToUse': '',
      'price': price,
      'originalPrice': originalPrice,
      'discountPercent': discountPercent,
      'stock': stock,
      'pointsEarned': 0,
      'rating': 0,
      'isNew': false,
      'isBestSeller': false,
      'isFeatured': false,
      'isPromo': false,
      'isBogo': false,
      'isActive': true,
      'tags': ['import:${preview.store}', if (preview.brandAr.isNotEmpty) preview.brandAr],
      'skinType': <String>[],
      'concernIds': <String>[],
      'imageIds': productImageIds,
      'shades': shades,
      'variants': <Map<String, dynamic>>[],
    };

    onProgress?.call('إنشاء المنتج', 1, 1);
    return createProduct(payload);
  }

  String? _validBarcode(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    if (isMiswagInternalId(raw)) return null;
    final n = normalizeBarcode(raw);
    return n.isNotEmpty ? n : null;
  }

  BarcodePosSnapshot? _resolveInv(String barcode, Map<String, BarcodeInventoryLookup> map) {
    for (final c in barcodeLookupCandidates(barcode)) {
      final hit = map[c];
      if (hit?.pos != null && (hit!.pos!.price > 0 || hit.pos!.stock > 0)) return hit.pos;
    }
    return null;
  }
}

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(ref.read(dioProvider));
});
