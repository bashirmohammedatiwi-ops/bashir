import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/api_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/json.dart';
import '../../core/utils/phone_util.dart';
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

export '../../core/network/api_exception.dart' show ApiException, parseApiErrorMessage;

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
      final status = e.response?.statusCode;
      final parsed = parseApiErrorMessage(e.response?.data);
      String msg = parsed ?? '';

      if (msg.isEmpty) {
        if (e.type == DioExceptionType.connectionError ||
            e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.sendTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          msg = 'تحقق من اتصالك بالإنترنت';
        } else if (status != null) {
          msg = switch (status) {
            400 => 'البيانات المدخلة غير صحيحة',
            401 => 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            403 => 'غير مسموح بهذا الإجراء',
            404 => 'غير موجود',
            409 => 'البيانات مستخدمة مسبقاً',
            422 => 'تحقق من البيانات المدخلة',
            429 => 'محاولات كثيرة — حاول لاحقاً',
            >= 500 => 'الخادم مشغول مؤقتاً',
            _ => 'حدث خطأ ($status)',
          };
        } else {
          msg = 'تعذّر الاتصال بالخادم';
        }
      }

      throw ApiException(msg, status);
    }
    throw ApiException(e.toString());
  }

  // ---- HOME ----
  Future<HomeFeed> getHome({bool forceRefresh = false}) async {
    try {
      final raw = await _cache.getOrFetch<Map<String, dynamic>>(
        key: 'home_v3',
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

  Future<HomeFeed> getOffers({bool forceRefresh = false}) async {
    try {
      return await _fetchOffers(forceRefresh: forceRefresh);
    } catch (_) {
      try {
        await Future<void>.delayed(const Duration(milliseconds: 400));
        return await _fetchOffers(forceRefresh: true);
      } catch (_) {
        return _offersFallbackFromHome();
      }
    }
  }

  Future<HomeFeed> _offersFallbackFromHome() async {
    try {
      final home = await getHome();
      return HomeFeed(
        sections: const [],
        flashSale: home.flashSale,
        promoProducts: home.promoProducts.isNotEmpty
            ? home.promoProducts
            : home.flashSale.products,
        settings: home.settings,
      );
    } catch (_) {
      return const HomeFeed();
    }
  }

  Future<HomeFeed> _fetchOffers({bool forceRefresh = false}) async {
    try {
      final raw = await _cache.getOrFetch<Map<String, dynamic>>(
        key: 'offers_v1',
        ttl: AppConfig.homeCacheTtl,
        forceRefresh: forceRefresh,
        fetch: () async {
          final r = await _dio.get('/offers', options: Options(extra: {'auth': false}));
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
        key: 'categories_all_v2',
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

  Future<Category> getCategoryBySlug(String slug) async {
    try {
      final r = await _dio.get(
        '/categories/${Uri.encodeComponent(slug)}',
        options: Options(extra: {'auth': false}),
      );
      return Category.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  // ---- BRANDS ----
  Future<List<Brand>> getBrands({
    bool featured = false,
    bool all = true,
    String? categoryId,
    String? subcategoryId,
    bool forceRefresh = false,
  }) async {
    try {
      final key = categoryId != null
          ? 'brands_cat_$categoryId'
          : subcategoryId != null
              ? 'brands_sub_$subcategoryId'
              : 'brands_f${featured ? 1 : 0}_a${all ? 1 : 0}';
      final raw = await _cache.getOrFetch<List<dynamic>>(
        key: key,
        ttl: AppConfig.catalogCacheTtl,
        forceRefresh: forceRefresh,
        fetch: () async {
          final r = await _dio.get('/brands', queryParameters: {
            if (featured) 'featured': '1',
            if (all) 'all': '1',
            if (categoryId != null) 'categoryId': categoryId,
            if (subcategoryId != null) 'subcategoryId': subcategoryId,
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

  Future<Brand> getBrandBySlug(String slug) async {
    try {
      final r = await _dio.get(
        '/brands/${Uri.encodeComponent(slug)}',
        options: Options(extra: {'auth': false}),
      );
      return Brand.fromJson(asMap(_data(r)));
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
    String? tertiaryCategoryId,
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
        tertiaryCategoryId: tertiaryCategoryId,
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
          if (tertiaryCategoryId != null) 'tertiaryCategoryId': tertiaryCategoryId,
          if (brandId != null) 'brandId': brandId,
          if (sort != null) 'sort': sort,
          if (minPrice != null) 'minPrice': minPrice,
          if (maxPrice != null) 'maxPrice': maxPrice,
          if (minRating != null) 'minRating': minRating,
          if (inStock == true) 'inStock': '1',
          if (isNew == true) 'isNew': '1',
          if (isBestSeller == true) 'isBestSeller': '1',
          if (isPromo == true) 'isPromo': '1',
          if (isFeatured == true) 'isFeatured': '1',
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
    String? tertiaryCategoryId,
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
      'products_v2',
      'l$limit',
      if (categoryId != null) 'c$categoryId',
      if (subcategoryId != null) 'sc$subcategoryId',
      if (tertiaryCategoryId != null) 'tc$tertiaryCategoryId',
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
        key: 'product_v2_$idOrSlug',
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
  Future<Map<String, dynamic>> login(String phone, String password) async {
    try {
      final r = await _dio.post('/auth/login',
          data: {'phone': normalizePhone(phone), 'password': password},
          options: Options(extra: {'auth': false}));
      return asMap(_data(r));
    } catch (e) {
      _throw(e);
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String phone,
    required String password,
    String? email,
  }) async {
    try {
      final r = await _dio.post('/auth/register',
          data: {
            'name': name,
            'phone': normalizePhone(phone),
            'password': password,
            if (email != null && email.isNotEmpty) 'email': email,
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
        if (phone != null) 'phone': normalizePhone(phone),
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

  Future<void> deleteAccount() async {
    try {
      await _dio.delete('/auth/me');
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
    final trimmed = code.trim();
    if (trimmed.isEmpty) return null;
    try {
      final r = await _dio.get(
        '/coupons/validate/${Uri.encodeComponent(trimmed)}',
        options: Options(extra: {'auth': false}),
      );
      final raw = _data(r);
      if (raw == null) return null;
      if (raw is! Map) return null;
      final data = Map<String, dynamic>.from(raw);
      if (data.isEmpty) return null;
      final coupon = Coupon.fromJson(data);
      if (!coupon.isActive || coupon.code.isEmpty) return null;
      return coupon;
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 404) return null;
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

  Future<void> registerGuestDevice({required String token, required String platform}) async {
    try {
      await _dio.post(
        '/notifications/devices/guest',
        data: {'token': token, 'platform': platform},
        options: Options(extra: {'auth': false}),
      );
    } catch (e) {
      _throw(e);
    }
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
