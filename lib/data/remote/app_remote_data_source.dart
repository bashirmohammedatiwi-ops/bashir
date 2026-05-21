import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_envelope.dart';
import '../models/address_model.dart';
import '../models/banner_model.dart';
import '../models/brand_model.dart';
import '../models/category_model.dart';
import '../models/coupon_model.dart';
import '../models/notification_model.dart';
import '../models/order_model.dart';
import '../models/product_model.dart';
import '../models/product_package_model.dart';
import '../models/review_model.dart';
import '../models/user_model.dart';
import 'product_remote_mapper.dart';
import 'remote_mappers.dart';

class AppRemoteDataSource {
  AppRemoteDataSource(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> homeFeed() async {
    final resp = await _dio.get('/home');
    return unwrapData(resp.data);
  }

  Future<Map<String, dynamic>> settings() async {
    final resp = await _dio.get('/settings');
    return unwrapData(resp.data);
  }

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
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map(ProductRemoteMapper.fromJson)
        .toList();
  }

  Future<ProductModel> findProduct(String idOrSlug) async {
    final resp = await _dio.get('/products/$idOrSlug');
    return ProductRemoteMapper.fromJson(unwrapData(resp.data));
  }

  Future<List<CategoryModel>> listCategories() async {
    final resp = await _dio.get('/categories');
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.category)
        .toList();
  }

  Future<List<BrandModel>> listBrands({bool featuredOnly = false}) async {
    final resp = await _dio.get(
      '/brands',
      queryParameters: featuredOnly ? {'featured': '1'} : null,
    );
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.brand)
        .toList();
  }

  Future<List<BannerModel>> listBanners() async {
    final resp = await _dio.get('/banners', queryParameters: {'active': '1'});
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.banner)
        .toList();
  }

  Future<List<ProductPackageModel>> listPackages() async {
    final resp = await _dio.get('/packages');
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.package)
        .toList();
  }

  Future<ProductPackageModel> findPackage(String id) async {
    final resp = await _dio.get('/packages/$id');
    return RemoteMappers.package(unwrapData(resp.data));
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final resp = await _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
    return unwrapData(resp.data);
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final resp = await _dio.post('/auth/register', data: {
      'name': name,
      'email': email,
      'phone': phone,
      'password': password,
    });
    return unwrapData(resp.data);
  }

  Future<UserModel> me() async {
    final resp = await _dio.get('/auth/me');
    return RemoteMappers.user(unwrapData(resp.data));
  }

  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final resp = await _dio.patch('/auth/me', data: data);
    return RemoteMappers.user(unwrapData(resp.data));
  }

  Future<List<OrderModel>> listOrders({int page = 1}) async {
    final resp = await _dio.get('/orders', queryParameters: {'page': page, 'limit': 20});
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.orderSummary)
        .toList();
  }

  Future<OrderModel> findOrder(String id) async {
    final resp = await _dio.get('/orders/$id');
    return RemoteMappers.orderDetail(unwrapData(resp.data));
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> body) async {
    final resp = await _dio.post('/orders', data: body);
    return unwrapData(resp.data);
  }

  Future<List<AddressModel>> listAddresses() async {
    final resp = await _dio.get('/addresses');
    final data = resp.data;
    final list = data is List ? data : unwrapList(data);
    return list
        .cast<Map<String, dynamic>>()
        .map(AddressModel.fromJson)
        .toList();
  }

  Future<AddressModel> createAddress(Map<String, dynamic> body) async {
    final resp = await _dio.post('/addresses', data: body);
    return AddressModel.fromJson(unwrapData(resp.data));
  }

  Future<CouponModel?> validateCoupon(String code) async {
    try {
      final resp = await _dio.get('/coupons/validate/$code');
      return RemoteMappers.coupon(unwrapData(resp.data));
    } catch (_) {
      return null;
    }
  }

  Future<List<ReviewModel>> productReviews(String productId) async {
    final resp = await _dio.get('/reviews/product/$productId');
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.review)
        .toList();
  }

  Future<List<NotificationModel>> notifications() async {
    final resp = await _dio.get('/notifications');
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.notification)
        .toList();
  }

  Future<Map<String, dynamic>> loyaltySummary() async {
    final resp = await _dio.get('/loyalty');
    return unwrapData(resp.data);
  }

  Future<List<ProductModel>> wishlist() async {
    final resp = await _dio.get('/wishlist');
    return unwrapList(resp.data)
        .cast<Map<String, dynamic>>()
        .map((e) => ProductRemoteMapper.fromJson(e['product'] as Map<String, dynamic>? ?? e))
        .toList();
  }

  Future<void> toggleWishlist(String productId) async {
    await _dio.post('/wishlist/$productId/toggle');
  }
}

final appRemoteDataSourceProvider = Provider<AppRemoteDataSource>(
  (ref) => AppRemoteDataSource(ref.read(apiClientProvider)),
);
