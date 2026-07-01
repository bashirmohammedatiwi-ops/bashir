import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/api_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/utils/json.dart';
import '../models/address.dart';
import '../models/brand.dart';
import '../models/category.dart';
import '../models/coupon.dart';
import '../models/home_feed.dart';
import '../models/loyalty_summary.dart';
import '../models/notification.dart';
import '../models/order.dart';
import '../models/paginated.dart';
import '../models/product.dart';
import '../models/review.dart';
import '../models/user.dart';

class ApiException implements Exception {
  final String message;
  final int? status;
  ApiException(this.message, [this.status]);
  @override
  String toString() => message;
}

/// واجهة موحّدة لكل نقاط الاتصال مع خادم لوحة التحكم.
class ApiService {
  final Dio _dio;
  final ApiCache _cache;
  ApiService(this._dio, this._cache);

  // ---- helpers ----
  dynamic _data(Response r) {
    final body = r.data;
    if (body is Map && body.containsKey('data')) return body['data'];
    return body;
  }

  Map<String, dynamic> _body(Response r) => asMap(r.data);

  Never _throw(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      String msg = 'تعذّر الاتصال بالخادم';
      if (data is Map && data['message'] != null) {
        final m = data['message'];
        msg = m is List ? m.join('، ') : m.toString();
      } else if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        msg = 'تحقق من اتصالك بالإنترنت';
      }
      throw ApiException(msg, e.response?.statusCode);
    }
    throw ApiException(e.toString());
  }

  // ---- HOME ----
  Future<HomeFeed> getHome({bool forceRefresh = false}) async {
    try {
      final raw = await _cache.getOrFetch<Map<String, dynamic>>(
        key: 'home_v1',
        ttl: AppConfig.homeCacheTtl,
        forceRefresh: forceRefresh,
        fetch: () async {
          final r = await _dio.get('/home', options: Options(extra: {'auth': false}));
          return asMap(_data(r));
        },
        parse: (json) => asMap(json),
        serialize: (m) => m,
      );
      return HomeFeed.fromJson(raw);
    } catch (e) {
      _throw(e);
    }
  }

  // ---- CATEGORIES ----
  Future<List<Category>> getCategories({bool forceRefresh = false}) async {
    try {
      final raw = await _cache.getOrFetch<List<dynamic>>(
        key: 'categories_all_v1',
        ttl: AppConfig.catalogCacheTtl,
        forceRefresh: forceRefresh,
        fetch: () async {
          final r = await _dio.get('/categories',
              queryParameters: {'all': '1'}, options: Options(extra: {'auth': false}));
          return asList(_data(r));
        },
        parse: (json) => asList(json),
        serialize: (list) => list,
      );
      return raw.map((e) => Category.fromJson(asMap(e))).toList();
    } catch (e) {
      _throw(e);
    }
  }

  // ---- BRANDS ----
  Future<List<Brand>> getBrands({
    bool featured = false,
    bool all = true,
    bool forceRefresh = false,
  }) async {
    try {
      final key = 'brands_f${featured ? 1 : 0}_a${all ? 1 : 0}';
      final raw = await _cache.getOrFetch<List<dynamic>>(
        key: key,
        ttl: AppConfig.catalogCacheTtl,
        forceRefresh: forceRefresh,
        fetch: () async {
          final r = await _dio.get('/brands', queryParameters: {
            if (featured) 'featured': '1',
            if (all) 'all': '1',
          }, options: Options(extra: {'auth': false}));
          return asList(_data(r));
        },
        parse: (json) => asList(json),
        serialize: (list) => list,
      );
      return raw.map((e) => Brand.fromJson(asMap(e))).toList();
    } catch (e) {
      _throw(e);
    }
  }

  // ---- PRODUCTS ----
  Future<Paginated<Product>> getProducts({
    int page = 1,
    int limit = 20,
    String? search,
    String? categoryId,
    String? subcategoryId,
    String? brandId,
    String? sort,
    int? minPrice,
    int? maxPrice,
    double? minRating,
    bool? inStock,
    bool? isNew,
    bool? isBestSeller,
    bool? isPromo,
    String? concernSlug,
    bool? isFeatured,
    bool lite = true,
    bool forceRefresh = false,
  }) async {
    try {
      final cacheKey = _productsCacheKey(
        page: page,
        limit: limit,
        search: search,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        brandId: brandId,
        sort: sort,
        isNew: isNew,
        isBestSeller: isBestSeller,
        isPromo: isPromo,
        concernSlug: concernSlug,
        isFeatured: isFeatured,
      );

      Future<Map<String, dynamic>> fetch() async {
        final r = await _dio.get('/products', queryParameters: {
          'page': page,
          'limit': limit,
          'lite': lite,
          if (search != null && search.isNotEmpty) 'search': search,
          if (categoryId != null) 'categoryId': categoryId,
          if (subcategoryId != null) 'subcategoryId': subcategoryId,
          if (brandId != null) 'brandId': brandId,
          if (sort != null) 'sort': sort,
          if (minPrice != null) 'minPrice': minPrice,
          if (maxPrice != null) 'maxPrice': maxPrice,
          if (minRating != null) 'minRating': minRating,
          if (inStock == true) 'inStock': 'true',
          if (isNew == true) 'isNew': true,
          if (isBestSeller == true) 'isBestSeller': true,
          if (isPromo == true) 'isPromo': true,
          if (isFeatured == true) 'isFeatured': true,
          if (concernSlug != null && concernSlug.isNotEmpty) 'concernSlug': concernSlug,
        }, options: Options(extra: {'auth': false}));
        return _body(r);
      }

      if (cacheKey != null) {
        final raw = await _cache.getOrFetch<Map<String, dynamic>>(
          key: cacheKey,
          ttl: AppConfig.listingCacheTtl,
          forceRefresh: forceRefresh,
          fetch: fetch,
          parse: (json) => asMap(json),
          serialize: (m) => m,
        );
        return Paginated.fromJson(raw, Product.fromJson);
      }

      return Paginated.fromJson(await fetch(), Product.fromJson);
    } catch (e) {
      _throw(e);
    }
  }

  String? _productsCacheKey({
    required int page,
    required int limit,
    String? search,
    String? categoryId,
    String? subcategoryId,
    String? brandId,
    String? sort,
    bool? isNew,
    bool? isBestSeller,
    bool? isPromo,
    String? concernSlug,
    bool? isFeatured,
  }) {
    if (page != 1) return null;
    if (search != null && search.isNotEmpty) return null;
    final parts = <String>[
      'products_v1',
      'l$limit',
      if (categoryId != null) 'c$categoryId',
      if (subcategoryId != null) 'sc$subcategoryId',
      if (brandId != null) 'b$brandId',
      if (sort != null) 's$sort',
      if (isNew == true) 'new',
      if (isBestSeller == true) 'best',
      if (isPromo == true) 'promo',
      if (isFeatured == true) 'feat',
      if (concernSlug != null && concernSlug.isNotEmpty) 'cn$concernSlug',
    ];
    return parts.join('_');
  }

  Future<Product> getProduct(String idOrSlug, {bool forceRefresh = false}) async {
    try {
      final raw = await _cache.getOrFetch<Map<String, dynamic>>(
        key: 'product_v1_$idOrSlug',
        ttl: AppConfig.productCacheTtl,
        forceRefresh: forceRefresh,
        fetch: () async {
          final r =
              await _dio.get('/products/$idOrSlug', options: Options(extra: {'auth': false}));
          return asMap(_data(r));
        },
        parse: (json) => asMap(json),
        serialize: (m) => m,
      );
      return Product.fromJson(raw);
    } catch (e) {
      _throw(e);
    }
  }

  Future<List<Review>> getProductReviews(String productId) async {
    try {
      final r = await _dio.get('/reviews/product/$productId',
          options: Options(extra: {'auth': false}));
      return asList(_data(r)).map(Review.fromJson).toList();
    } catch (e) {
      _throw(e);
    }
  }

  Future<void> addReview(String productId, double rating, String comment) async {
    try {
      await _dio.post('/reviews',
          data: {'productId': productId, 'rating': rating, 'comment': comment});
    } catch (e) {
      _throw(e);
    }
  }

  // ---- AUTH ----
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final r = await _dio.post('/auth/login',
          data: {'email': email, 'password': password},
          options: Options(extra: {'auth': false}));
      return asMap(_data(r));
    } catch (e) {
      _throw(e);
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      final r = await _dio.post('/auth/register',
          data: {
            'name': name,
            'email': email,
            'password': password,
            if (phone != null && phone.isNotEmpty) 'phone': phone,
          },
          options: Options(extra: {'auth': false}));
      return asMap(_data(r));
    } catch (e) {
      _throw(e);
    }
  }

  Future<AppUser> getMe() async {
    try {
      final r = await _dio.get('/auth/me');
      return AppUser.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<AppUser> updateProfile({String? name, String? phone, String? birthday}) async {
    try {
      final r = await _dio.patch('/auth/me', data: {
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
        if (birthday != null) 'birthday': birthday,
      });
      return AppUser.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _dio.post('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
    } catch (e) {
      _throw(e);
    }
  }

  Future<void> logout(String refreshToken) async {
    try {
      await _dio.post('/auth/logout', data: {'refreshToken': refreshToken});
    } catch (_) {/* تجاهل */}
  }

  // ---- WISHLIST ----
  Future<List<Product>> getWishlist() async {
    try {
      final r = await _dio.get('/wishlist');
      return asList(_data(r))
          .map((e) => Product.fromJson(asMap(e['product'])))
          .where((p) => p.id.isNotEmpty)
          .toList();
    } catch (e) {
      _throw(e);
    }
  }

  Future<bool> toggleWishlist(String productId) async {
    try {
      final r = await _dio.post('/wishlist/$productId/toggle');
      return asBool(asMap(_data(r))['added']);
    } catch (e) {
      _throw(e);
    }
  }

  // ---- ADDRESSES ----
  Future<List<Address>> getAddresses() async {
    try {
      final r = await _dio.get('/addresses');
      return asList(_data(r)).map(Address.fromJson).toList();
    } catch (e) {
      _throw(e);
    }
  }

  Future<Address> createAddress(Address address) async {
    try {
      final r = await _dio.post('/addresses', data: address.toJson());
      return Address.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<Address> updateAddress(String id, Address address) async {
    try {
      final r = await _dio.patch('/addresses/$id', data: address.toJson());
      return Address.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<void> deleteAddress(String id) async {
    try {
      await _dio.delete('/addresses/$id');
    } catch (e) {
      _throw(e);
    }
  }

  // ---- SHIPPING ----
  Future<List<Map<String, dynamic>>> getShippingZones() async {
    try {
      final r = await _dio.get('/shipping/zones', options: Options(extra: {'auth': false}));
      return asList(_data(r));
    } catch (e) {
      _throw(e);
    }
  }

  Future<int> shippingQuote({
    String? governorate,
    String? area,
    int? subtotal,
    String deliveryOption = 'STANDARD',
  }) async {
    try {
      final r = await _dio.get('/shipping/quote', queryParameters: {
        if (governorate != null) 'governorate': governorate,
        if (area != null) 'area': area,
        if (subtotal != null) 'subtotal': subtotal,
        'deliveryOption': deliveryOption,
      }, options: Options(extra: {'auth': false}));
      return asInt(asMap(_data(r))['fee']);
    } catch (e) {
      _throw(e);
    }
  }

  // ---- LOYALTY ----
  Future<LoyaltySummary> getLoyalty() async {
    try {
      final r = await _dio.get('/loyalty');
      return LoyaltySummary.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  // ---- PACKAGES ----
  Future<Map<String, dynamic>> getPackage(String idOrSlug) async {
    try {
      final r = await _dio.get('/packages/$idOrSlug', options: Options(extra: {'auth': false}));
      return asMap(_data(r));
    } catch (e) {
      try {
        final r = await _dio.get('/packages/slug/$idOrSlug', options: Options(extra: {'auth': false}));
        return asMap(_data(r));
      } catch (e2) {
        _throw(e);
      }
    }
  }

  Future<List<Map<String, dynamic>>> getPackages() async {
    try {
      final r = await _dio.get('/packages', queryParameters: {'all': '1', 'lite': '1'},
          options: Options(extra: {'auth': false}));
      return asList(_data(r)).map((e) => asMap(e)).toList();
    } catch (e) {
      _throw(e);
    }
  }

  // ---- COUPONS ----
  Future<Coupon?> validateCoupon(String code) async {
    try {
      final r = await _dio.get('/coupons/validate/$code',
          options: Options(extra: {'auth': false}));
      final data = asMap(_data(r));
      if (data.isEmpty) return null;
      return Coupon.fromJson(data);
    } catch (e) {
      _throw(e);
    }
  }

  // ---- ORDERS ----
  Future<Paginated<AppOrder>> getOrders({int page = 1, int limit = 20}) async {
    try {
      final r = await _dio.get('/orders', queryParameters: {'page': page, 'limit': limit});
      return Paginated.fromJson(_body(r), AppOrder.fromJson);
    } catch (e) {
      _throw(e);
    }
  }

  Future<AppOrder> getOrder(String id) async {
    try {
      final r = await _dio.get('/orders/$id');
      return AppOrder.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<AppOrder> createOrder({
    required List<Map<String, dynamic>> items,
    String? addressId,
    String? couponCode,
    String? notes,
    String deliveryOption = 'STANDARD',
    int loyaltySpent = 0,
    String paymentMethod = 'COD',
  }) async {
    try {
      final r = await _dio.post('/orders', data: {
        'items': items,
        'paymentMethod': paymentMethod,
        'deliveryOption': deliveryOption,
        if (addressId != null) 'addressId': addressId,
        if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (loyaltySpent > 0) 'loyaltySpent': loyaltySpent,
      });
      return AppOrder.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<void> cancelOrder(String id) async {
    try {
      await _dio.patch('/orders/$id/cancel');
    } catch (e) {
      _throw(e);
    }
  }

  // ---- NOTIFICATIONS ----
  Future<List<AppNotification>> getNotifications({int page = 1, int limit = 30}) async {
    try {
      final r = await _dio.get('/notifications', queryParameters: {'page': page, 'limit': limit});
      return Paginated.fromJson(_body(r), AppNotification.fromJson).items;
    } catch (e) {
      _throw(e);
    }
  }

  Future<void> markNotificationRead(String id) async {
    try {
      await _dio.patch('/notifications/$id/read');
    } catch (_) {}
  }

  Future<void> markAllNotificationsRead() async {
    try {
      await _dio.patch('/notifications/read-all');
    } catch (_) {}
  }

  Future<void> registerDevice({required String token, required String platform}) async {
    try {
      await _dio.post('/notifications/devices', data: {
        'token': token,
        'platform': platform,
      });
    } catch (e) {
      _throw(e);
    }
  }

  Future<void> unregisterDevice({required String token}) async {
    try {
      await _dio.delete('/notifications/devices', data: {'token': token});
    } catch (_) {}
  }
}

final apiServiceProvider = Provider<ApiService>(
  (ref) => ApiService(ref.read(dioProvider), ref.read(apiCacheProvider)),
);
