import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../core/utils/json.dart';
import '../models/catalog.dart';

class CatalogRepository {
  CatalogRepository(this._dio);

  final Dio _dio;

  int _barcodeTimeoutMs(String storeId) {
    switch (storeId) {
      case 'faces':
        return 45000;
      case 'miraaya':
      case 'amazon':
        return 30000;
      case 'beautyway':
        return 20000;
      case 'miswag':
        return 22000;
      case 'elryan':
      case 'khaton':
      case 'waheteter':
        return 8000;
      case 'niceone':
        return 20000;
      case 'orisdi':
        return 28000;
      case 'alkhabeer':
      case 'najdalatheyah':
        return 12000;
      default:
        return 12000;
    }
  }

  int _textTimeoutMs(String storeId) {
    if (storeId == 'faces') return 25000;
    if (storeId == 'amazon') return 18000;
    if (storeId == 'miraaya') return 20000;
    if (storeId == 'orisdi') return 18000;
    if (storeId == 'niceone') return 22000;
    return 12000;
  }

  Future<List<CatalogStore>> fetchCatalogStores() async {
    try {
      final resp = await _dio.get('/api/catalog/stores');
      final data = asMap(resp.data);
      final rows = (data['stores'] as List?) ?? [];
      if (rows.isNotEmpty) {
        return rows.map((r) => CatalogStore.fromJson(asMap(r))).toList();
      }
    } catch (_) {}
    return AppConfig.catalogStores
        .map((id) => CatalogStore(id: id, label: id))
        .toList();
  }

  Future<List<CatalogImportOption>> searchByBarcode(
    String barcode, {
    List<String>? stores,
    void Function(List<CatalogImportOption> partial)? onPartial,
  }) async {
    final result = await searchByBarcodeDetailed(
      barcode,
      stores: stores,
      onPartial: onPartial == null
          ? null
          : (partial) => onPartial(partial.options),
    );
    return result.options;
  }

  Future<CatalogBarcodeSearchResult> searchByBarcodeDetailed(
    String barcode, {
    List<String>? stores,
    void Function(CatalogBarcodeSearchResult partial)? onPartial,
  }) async {
    final storeIds = stores ?? AppConfig.catalogStores;
    final results = <CatalogImportOption>[];
    final stats = <StoreSearchStat>[];

    await Future.wait(storeIds.map((id) async {
      var count = 0;
      String? error;
      try {
        final resp = await _dio.get(
          '/api/import/search',
          queryParameters: {'q': barcode.trim(), 'store': id, 'stores': id},
          options: Options(receiveTimeout: Duration(milliseconds: _barcodeTimeoutMs(id))),
        );
        final data = asMap(resp.data);
        final items = ((data['results'] as List?) ?? [])
            .map((r) => CatalogImportOption.fromJson(asMap(r), id))
            .toList();
        count = items.length;
        results.addAll(items);
      } catch (e) {
        if (e is DioException) {
          final status = e.response?.statusCode;
          if (e.type == DioExceptionType.receiveTimeout) {
            error = 'بطيء';
          } else if (status == 502 || status == 503 || status == 504) {
            error = 'السيرفر';
          } else if (status == 404) {
            error = null;
          } else {
            error = 'خطأ';
          }
        } else {
          error = 'خطأ';
        }
      } finally {
        stats.add(StoreSearchStat(
          storeId: id,
          storeLabel: id,
          count: count,
          error: error,
          done: true,
        ));
        onPartial?.call(CatalogBarcodeSearchResult(
          options: _rankOptions([...results]),
          stats: [...stats],
        ));
      }
    }));

    return CatalogBarcodeSearchResult(
      options: _rankOptions(results),
      stats: stats,
    );
  }

  Future<List<CatalogImportOption>> searchByText(
    String query, {
    List<String>? stores,
    void Function(List<CatalogImportOption> partial)? onPartial,
  }) async {
    final q = query.trim();
    if (q.isEmpty) return [];

    final storeIds = stores ?? AppConfig.catalogStores;
    final results = <CatalogImportOption>[];

    await Future.wait(storeIds.map((id) async {
      try {
        final resp = await _dio.get(
          '/api/catalog/${Uri.encodeComponent(id)}/search',
          queryParameters: {'q': q, 'limit': 8},
          options: Options(receiveTimeout: Duration(milliseconds: _textTimeoutMs(id))),
        );
        final data = asMap(resp.data);
        final items = ((data['products'] as List?) ?? (data['items'] as List?) ?? [])
            .map((r) => CatalogImportOption.fromJson(asMap(r), id))
            .toList();
        results.addAll(items);
      } catch (_) {
        // optional per-store
      } finally {
        onPartial?.call(_rankOptions([...results]));
      }
    }));

    return _rankOptions(results);
  }

  List<CatalogImportOption> _rankOptions(List<CatalogImportOption> options) {
    int rank(CatalogImportOption o) {
      final t = o.matchType ?? '';
      if (t == 'ean' || t == 'sku') return 0;
      if (t == 'text' || t == 'keyword') return 2;
      return 1;
    }

    final sorted = [...options]..sort((a, b) => rank(a).compareTo(rank(b)));
    return sorted;
  }

  Future<CatalogImportProduct> fetchProduct(String storeId, String sourceId, {String storeLabel = ''}) async {
    final resp = await _dio.get(
      '/api/import/${Uri.encodeComponent(storeId)}/products/${Uri.encodeComponent(sourceId)}',
      options: Options(receiveTimeout: AppConfig.catalogTimeout),
    );
    final data = asMap(resp.data);
    return CatalogImportProduct.fromJson(asMap(data['product']), storeLabel: storeLabel, storeId: storeId);
  }

  Future<CatalogImportProduct> fetchCatalogProduct(
    String storeId,
    String sourceId, {
    String storeLabel = '',
    bool light = false,
  }) async {
    final resp = await _dio.get(
      '/api/catalog/${Uri.encodeComponent(storeId)}/products/${Uri.encodeComponent(sourceId)}',
      queryParameters: light ? {'light': '1'} : null,
      options: Options(receiveTimeout: light ? const Duration(seconds: 45) : AppConfig.catalogTimeout),
    );
    final data = asMap(resp.data);
    return CatalogImportProduct.fromJson(asMap(data['product']), storeLabel: storeLabel, storeId: storeId);
  }

  /// جلب ذكي — يدمج التدرجات من مسارات متعددة عند الحاجة.
  Future<CatalogImportProduct> fetchProductSmart(
    String storeId,
    String sourceId, {
    String storeLabel = '',
    int shadeCountHint = 0,
    void Function(CatalogImportProduct partial)? onPartial,
  }) async {
    if (storeId == 'amazon') {
      return _fetchAmazonSmart(storeId, sourceId, storeLabel: storeLabel, onPartial: onPartial);
    }

    var product = await fetchProduct(storeId, sourceId, storeLabel: storeLabel);
    final expected = shadeCountHint > 1 ? shadeCountHint : (product.hasShades ? 2 : 1);

    if (product.shades.length >= expected) return product;

    CatalogImportProduct? lightProduct;
    try {
      lightProduct = await fetchCatalogProduct(storeId, sourceId, storeLabel: storeLabel, light: true);
      if (lightProduct.shades.length > product.shades.length) {
        product = _mergeShades(product, lightProduct);
        onPartial?.call(product);
      }
    } catch (_) {}

    try {
      final catalogFull = await fetchCatalogProduct(storeId, sourceId, storeLabel: storeLabel, light: false);
      if (catalogFull.shades.length > product.shades.length) {
        product = _mergeShades(product, catalogFull);
      }
    } catch (_) {
      if (lightProduct != null && lightProduct.shades.length > product.shades.length) {
        product = _mergeShades(product, lightProduct);
      }
    }

    return product;
  }

  Future<CatalogImportProduct> _fetchAmazonSmart(
    String storeId,
    String sourceId, {
    String storeLabel = '',
    void Function(CatalogImportProduct partial)? onPartial,
  }) async {
    CatalogImportProduct? lightProduct;
    try {
      lightProduct = await fetchCatalogProduct(storeId, sourceId, storeLabel: storeLabel, light: true);
      if (lightProduct.shades.isNotEmpty) onPartial?.call(lightProduct);
    } catch (_) {
      lightProduct = null;
    }

    try {
      final full = await fetchProduct(storeId, sourceId, storeLabel: storeLabel);
      if (lightProduct != null && lightProduct.shades.length > full.shades.length) {
        return _mergeShades(full, lightProduct);
      }
      return full;
    } catch (_) {
      if (lightProduct != null) return lightProduct;
      rethrow;
    }
  }

  CatalogImportProduct _mergeShades(CatalogImportProduct base, CatalogImportProduct extra) {
    if (extra.shades.length <= base.shades.length) return base;

    final byKey = <String, CatalogImportShade>{};
    for (final s in base.shades) {
      final key = _shadeKey(s);
      if (key.isNotEmpty) byKey[key] = s;
    }

    final merged = <CatalogImportShade>[];
    for (final s in extra.shades) {
      final key = _shadeKey(s);
      final existing = key.isNotEmpty ? byKey[key] : null;
      if (existing != null) {
        merged.add(CatalogImportShade(
          id: existing.id ?? s.id,
          name: existing.name.isNotEmpty ? existing.name : s.name,
          nameAr: existing.nameAr ?? s.nameAr,
          nameEn: existing.nameEn ?? s.nameEn,
          barcode: existing.barcode?.isNotEmpty == true ? existing.barcode : s.barcode,
          colorHex: existing.colorHex?.isNotEmpty == true ? existing.colorHex : s.colorHex,
          imageUrl: existing.imageUrl?.isNotEmpty == true ? existing.imageUrl : s.imageUrl,
          sku: existing.sku ?? s.sku,
          miswagId: existing.miswagId ?? s.miswagId,
          price: existing.price?.isNotEmpty == true ? existing.price : s.price,
        ));
      } else {
        merged.add(s);
      }
    }

    for (final s in base.shades) {
      final key = _shadeKey(s);
      if (key.isEmpty || !merged.any((m) => _shadeKey(m) == key)) merged.add(s);
    }

    return base.copyWith(shades: merged, hasShades: merged.length > 1);
  }

  String _shadeKey(CatalogImportShade s) {
    final sku = (s.sku ?? s.miswagId ?? s.id ?? '').trim().toUpperCase();
    if (sku.isNotEmpty) return sku;
    final bc = (s.barcode ?? '').trim();
    if (bc.isNotEmpty) return 'bc:$bc';
    return (s.nameAr ?? s.nameEn ?? s.name).trim().toLowerCase();
  }
}

final catalogRepositoryProvider = Provider<CatalogRepository>((ref) {
  return CatalogRepository(ref.read(catalogDioProvider));
});
