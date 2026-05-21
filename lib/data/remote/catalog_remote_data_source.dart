import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../models/product_model.dart';
import 'product_remote_mapper.dart';

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
  }) async {
    final resp = await _dio.get(
      '/products',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (categoryId != null) 'categoryId': categoryId,
        if (subcategoryId != null) 'subcategoryId': subcategoryId,
        if (brandId != null) 'brandId': brandId,
        if (search != null && search.isNotEmpty) 'search': search,
        if (sort != null) 'sort': sort,
        if (isFeatured != null) 'isFeatured': isFeatured,
        if (isNew != null) 'isNew': isNew,
        if (isBestSeller != null) 'isBestSeller': isBestSeller,
        if (isPromo != null) 'isPromo': isPromo,
      },
    );
    final data = resp.data;
    final items = data is Map<String, dynamic>
        ? (data['data'] as List? ?? const [])
        : (data as List? ?? const []);
    return items
        .cast<Map<String, dynamic>>()
        .map(ProductRemoteMapper.fromJson)
        .toList();
  }

  Future<ProductModel> findProduct(String idOrSlug) async {
    final resp = await _dio.get('/products/$idOrSlug');
    final data = resp.data is Map<String, dynamic>
        ? (resp.data['data'] ?? resp.data)
        : resp.data;
    return ProductRemoteMapper.fromJson(data as Map<String, dynamic>);
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
