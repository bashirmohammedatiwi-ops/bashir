import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../models/product_model.dart';
import 'product_remote_mapper.dart';

List<dynamic> _extractDataList(dynamic data) {
  if (data is Map) {
    final inner = data['data'];
    if (inner is List) return inner;
  }
  if (data is List) return data;
  return const [];
}

class CatalogRemoteDataSource {
  CatalogRemoteDataSource(this._dio);
  final Dio _dio;

  Future<List<ProductModel>> listProducts({
    int page = 1,
    int limit = 20,
    String? categoryId,
    String? subcategoryId,
    String? brandId,
    String? search,
    String? sort,
    bool? isFeatured,
    bool? isNew,
    bool? isBestSeller,
    bool? isPromo,
    int? minPrice,
    int? maxPrice,
    double? minRating,
    bool? inStock,
    String? skinType,
  }) async {
    final resp = await _dio.get(
      '/products',
      queryParameters: {
        'lite': 1,
        'page': page,
        'limit': limit,
        if (categoryId != null) 'categoryId': categoryId,
        if (subcategoryId != null) 'subcategoryId': subcategoryId,
        if (brandId != null) 'brandId': brandId,
        if (search != null && search.isNotEmpty) 'search': search,
        if (sort != null) 'sort': sort,
        if (isFeatured == true) 'isFeatured': true,
        if (isNew == true) 'isNew': true,
        if (isBestSeller == true) 'isBestSeller': true,
        if (isPromo == true) 'isPromo': true,
        if (minPrice != null) 'minPrice': minPrice,
        if (maxPrice != null) 'maxPrice': maxPrice,
        if (minRating != null) 'minRating': minRating,
        if (inStock == true) 'inStock': true,
        if (skinType != null) 'skinType': skinType,
      },
    );
    final items = _extractDataList(resp.data);
    final products = <ProductModel>[];
    for (final item in items) {
      if (item is! Map) continue;
      try {
        products.add(
          ProductRemoteMapper.fromJson(Map<String, dynamic>.from(item)),
        );
      } catch (_) {
        // تخطي عنصر تالف دون إسقاط القائمة كاملة
      }
    }
    return products;
  }

  Future<ProductModel> findProduct(String idOrSlug) async {
    final resp = await _dio.get('/products/$idOrSlug');
    final raw = resp.data;
    final data = raw is Map ? (raw['data'] ?? raw) : raw;
    return ProductRemoteMapper.fromJson(
      Map<String, dynamic>.from(data as Map),
    );
  }

  Future<List<Map<String, dynamic>>> listCategories() async {
    final resp = await _dio.get('/categories');
    final data = resp.data;
    final items = data is Map<String, dynamic>
        ? (data['data'] as List? ?? const [])
        : (data as List? ?? const []);
    return items.cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> listBrands({bool featuredOnly = false}) async {
    final resp = await _dio.get(
      '/brands',
      queryParameters: featuredOnly ? {'featured': '1'} : null,
    );
    final data = resp.data;
    final items = data is Map<String, dynamic>
        ? (data['data'] as List? ?? const [])
        : (data as List? ?? const []);
    return items.cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> listBanners() async {
    final resp = await _dio.get('/banners', queryParameters: {'active': '1'});
    final data = resp.data;
    final items = data is Map<String, dynamic>
        ? (data['data'] as List? ?? const [])
        : (data as List? ?? const []);
    return items.cast<Map<String, dynamic>>();
  }

  Future<List<Map<String, dynamic>>> listPackages() async {
    final resp = await _dio.get('/packages');
    final data = resp.data;
    final items = data is Map<String, dynamic>
        ? (data['data'] as List? ?? const [])
        : (data as List? ?? const []);
    return items.cast<Map<String, dynamic>>();
  }
}

final catalogRemoteDataSourceProvider = Provider<CatalogRemoteDataSource>(
  (ref) => CatalogRemoteDataSource(ref.read(apiClientProvider)),
);
