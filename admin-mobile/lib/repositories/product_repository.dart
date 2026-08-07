import 'dart:typed_data';

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
    final keys = <String>{};
    for (final raw in barcodes) {
      keys.addAll(posBarcodeLookupKeys(raw));
    }
    final normalized = keys.where((b) => b.isNotEmpty).toList();
    if (normalized.isEmpty) return {};

    final resp = await _dio.post('/sync/inventory/lookup-barcodes', data: {'barcodes': normalized});
    final body = asMap(resp.data['data'] ?? resp.data);
    final items = asMap(body['items']);
    return items.map((k, v) => MapEntry(k, BarcodeInventoryLookup.fromJson(k, asMap(v))));
  }

  /// Uploads a remote image. Retries server then device-side fetch.
  /// Returns null only when every attempt fails (caller should not silent-skip).
  Future<String?> uploadImageFromUrl(String url, {String purpose = 'PRODUCT'}) async {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return null;

    for (var attempt = 0; attempt < 2; attempt++) {
      try {
        final id = await _uploadImageFromUrlServer(trimmed, purpose: purpose);
        if (id != null && id.isNotEmpty) return id;
      } catch (_) {}
      try {
        final id = await _uploadImageFromUrlClient(trimmed, purpose: purpose);
        if (id != null && id.isNotEmpty) return id;
      } catch (_) {}
      if (attempt == 0) {
        await Future<void>.delayed(const Duration(milliseconds: 450));
      }
    }
    return null;
  }

  /// Like [uploadImageFromUrl] but throws when the image cannot be uploaded.
  Future<String> uploadImageFromUrlRequired(String url, {String purpose = 'PRODUCT'}) async {
    final id = await uploadImageFromUrl(url, purpose: purpose);
    if (id != null && id.isNotEmpty) return id;
    final host = Uri.tryParse(url.trim())?.host;
    throw Exception(
      host != null && host.isNotEmpty
          ? 'تعذّر رفع صورة من $host'
          : 'تعذّر رفع إحدى الصور المختارة',
    );
  }

  Future<String?> uploadImageBytes(
    Uint8List bytes, {
    String purpose = 'PRODUCT',
    String filename = 'edited.jpg',
    String contentType = 'image/jpeg',
  }) async {
    if (bytes.length < 64) return null;
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(
          bytes,
          filename: filename,
          contentType: DioMediaType.parse(contentType),
        ),
        'purpose': purpose,
      });
      final uploadResp = await _dio.post(
        '/media/upload',
        data: formData,
        options: Options(
          receiveTimeout: const Duration(seconds: 120),
          contentType: 'multipart/form-data',
        ),
      );
      final data = asMap(uploadResp.data['data'] ?? uploadResp.data);
      return data['id']?.toString();
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل رفع الصورة المعدّلة'));
    }
  }

  Future<String?> _uploadImageFromUrlServer(String url, {String purpose = 'PRODUCT'}) async {
    final resp = await _dio.post(
      '/media/upload-from-url',
      data: {'url': url.trim(), 'purpose': purpose},
      options: Options(receiveTimeout: const Duration(seconds: 120)),
    );
    final data = asMap(resp.data['data'] ?? resp.data);
    return data['id']?.toString();
  }

  /// يحمّل الصورة من جهاز الموظف (عندما السيرفر لا يصل للمصدر — مثل واحة عطر).
  Future<String?> _uploadImageFromUrlClient(String url, {String purpose = 'PRODUCT'}) async {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return null;

    final headers = <String, String>{
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'User-Agent':
          'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    };
    final uri = Uri.tryParse(trimmed);
    if (uri != null && uri.hasScheme && uri.host.isNotEmpty) {
      headers['Referer'] = '${uri.scheme}://${uri.host}/';
    }
    if (trimmed.contains('waheteter.com')) {
      headers['Referer'] = 'https://waheteter.com/';
    }
    if (trimmed.contains('niceonesa.com') ||
        trimmed.contains('d1aq4ubbxe020v.cloudfront.net') ||
        trimmed.contains('d3e7ardzpaj3y4.cloudfront.net')) {
      headers['Referer'] = 'https://niceonesa.com/ar/';
    }
    if (trimmed.contains('googleusercontent.com') || trimmed.contains('ggpht.com')) {
      headers['Referer'] = 'https://www.google.com/';
    }

    final fetcher = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 90),
        responseType: ResponseType.bytes,
        followRedirects: true,
        headers: headers,
      ),
    );

    late final Response<dynamic> resp;
    try {
      resp = await fetcher.get<dynamic>(trimmed);
    } catch (_) {
      return null;
    }

    if (resp.statusCode != 200 || resp.data == null) return null;
    final raw = resp.data;
    final bytes = raw is Uint8List ? raw : Uint8List.fromList(List<int>.from(raw as List));
    if (bytes.length < 64) return null;

    final contentType = resp.headers.value('content-type')?.split(';').first.trim() ?? 'image/jpeg';
    final ext = contentType.contains('png')
        ? 'png'
        : contentType.contains('webp')
            ? 'webp'
            : contentType.contains('gif')
                ? 'gif'
                : 'jpg';

    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(
        bytes,
        filename: 'import-${DateTime.now().millisecondsSinceEpoch}.$ext',
        contentType: DioMediaType.parse(contentType),
      ),
      'purpose': purpose,
    });

    final uploadResp = await _dio.post(
      '/media/upload',
      data: formData,
      options: Options(
        receiveTimeout: const Duration(seconds: 120),
        contentType: 'multipart/form-data',
      ),
    );
    final data = asMap(uploadResp.data['data'] ?? uploadResp.data);
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

  Future<Map<String, dynamic>> getProduct(String idOrSlug) async {
    try {
      final resp = await _dio.get('/products/$idOrSlug');
      return asMap(resp.data['data'] ?? resp.data);
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل جلب المنتج'));
    }
  }

  Future<Map<String, dynamic>> updateProduct(String id, Map<String, dynamic> payload) async {
    try {
      final resp = await _dio.patch('/products/$id', data: payload);
      return asMap(resp.data['data'] ?? resp.data);
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل تحديث المنتج'));
    }
  }

  Future<void> deleteProduct(String id) async {
    try {
      await _dio.delete('/products/$id');
    } on DioException catch (e) {
      throw Exception(extractApiError(e, 'فشل حذف المنتج'));
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
    final multi = await sanitizeCategoryHierarchyMulti(
      categoryId: categoryId,
      subcategoryIds: [
        if (subcategoryId != null && subcategoryId.isNotEmpty) subcategoryId,
      ],
      tertiaryCategoryIds: [
        if (tertiaryCategoryId != null && tertiaryCategoryId.isNotEmpty) tertiaryCategoryId,
      ],
    );
    return (
      subcategoryId: multi.subcategoryIds.isNotEmpty ? multi.subcategoryIds.first : null,
      tertiaryCategoryId: multi.tertiaryCategoryIds.isNotEmpty ? multi.tertiaryCategoryIds.first : null,
    );
  }

  Future<({List<String> subcategoryIds, List<String> tertiaryCategoryIds})> sanitizeCategoryHierarchyMulti({
    required String categoryId,
    List<String> subcategoryIds = const [],
    List<String> tertiaryCategoryIds = const [],
  }) async {
    final validSubs = await subcategories(parentId: categoryId);
    final subSet = validSubs.map((s) => s.id).toSet();
    final safeSubs = [
      ...{for (final id in subcategoryIds) if (subSet.contains(id)) id},
    ];

    final safeTerts = <String>[];
    final tertSeen = <String>{};
    if (safeSubs.isNotEmpty && tertiaryCategoryIds.isNotEmpty) {
      for (final subId in safeSubs) {
        final sections = await tertiarySections(parentId: subId);
        final allowed = sections.map((t) => t.id).toSet();
        for (final tid in tertiaryCategoryIds) {
          if (allowed.contains(tid) && tertSeen.add(tid)) safeTerts.add(tid);
        }
      }
    }

    return (subcategoryIds: safeSubs, tertiaryCategoryIds: safeTerts);
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
    List<String>? subcategoryIds,
    List<String>? tertiaryCategoryIds,
    List<CatalogImportShade>? shadesOverride,
    int? priceOverride,
    int? stockOverride,
    void Function(String stage, int done, int total)? onProgress,
  }) async {
    if (brandId.isEmpty) {
      throw Exception('اختر البراند');
    }
    if (categoryId == null || categoryId.isEmpty) {
      throw Exception('اختر القسم الرئيسي');
    }

    final mergedSubs = <String>{
      ...?subcategoryIds,
      if (subcategoryId != null && subcategoryId.isNotEmpty) subcategoryId,
    }.toList();
    final mergedTerts = <String>{
      ...?tertiaryCategoryIds,
      if (tertiaryCategoryId != null && tertiaryCategoryId.isNotEmpty) tertiaryCategoryId,
    }.toList();
    final sanitized = await sanitizeCategoryHierarchyMulti(
      categoryId: categoryId,
      subcategoryIds: mergedSubs,
      tertiaryCategoryIds: mergedTerts,
    );
    final safeSubs = sanitized.subcategoryIds;
    final safeTerts = sanitized.tertiaryCategoryIds;

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

    final activeShades = shadesOverride ?? preview.shades;
    final shades = <Map<String, dynamic>>[];
    for (var i = 0; i < activeShades.length; i++) {
      final s = activeShades[i];
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
    if (priceOverride != null && priceOverride > 0) price = priceOverride;
    if (stockOverride != null && stockOverride >= 0) stock = stockOverride;
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
      if (safeSubs.isNotEmpty) 'subcategoryId': safeSubs.first,
      if (safeTerts.isNotEmpty) 'tertiaryCategoryId': safeTerts.first,
      if (safeSubs.isNotEmpty) 'subcategoryIds': safeSubs,
      if (safeTerts.isNotEmpty) 'tertiaryCategoryIds': safeTerts,
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
    for (final c in posBarcodeLookupKeys(barcode)) {
      final hit = map[c];
      if (hit?.pos != null && (hit!.pos!.price > 0 || hit.pos!.stock > 0)) return hit.pos;
    }
    return null;
  }
}

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  return ProductRepository(ref.read(dioProvider));
});
