import 'dart:convert';
import 'dart:math' as math;

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/cache/api_cache.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_client.dart';
import '../../core/network/api_exception.dart';
import '../../core/utils/json.dart';
import '../../core/utils/phone_util.dart';
import '../models/address.dart';
import '../models/barcode_lookup.dart';
import '../models/brand.dart';
import '../models/category.dart';
import '../models/coupon.dart';
import '../models/beauty.dart';
import '../models/home_feed.dart';
import '../models/loyalty_summary.dart';
import '../models/notification.dart';
import '../models/order.dart';
import '../models/paginated.dart';
import '../models/payment.dart';
import '../models/product.dart';
import '../models/review.dart';
import '../models/search_instant.dart';
import '../models/store_world.dart';
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

  /// GET عام يُرجع نص الجسم كما وصل — للكاش ([ApiCache.getOrFetchJson]): يُحفظ على القرص
  /// بلا إعادة ترميز، والكبير يُفكّ ويُبنى نموذجه خارج خيط الواجهة.
  /// رد الخطأ يُفكّ هنا ليقرأ [_throw] رسالة الخادم ورمزه كالعادة.
  Future<String> _getRaw(String path, {Map<String, dynamic>? query}) async {
    try {
      final r = await _dio.get<String>(
        path,
        queryParameters: query,
        options: Options(responseType: ResponseType.plain, extra: {'auth': false}),
      );
      return r.data ?? '';
    } on DioException catch (e) {
      final res = e.response;
      final body = res?.data;
      if (res != null && body is String && body.isNotEmpty) {
        try {
          res.data = jsonDecode(body);
        } catch (_) {}
      }
      rethrow;
    }
  }

  static String? _nonEmpty(String? v) {
    final t = v?.trim();
    return (t == null || t.isEmpty) ? null : t;
  }

  /// يحوّل خطأ الطلب إلى [ApiException] بلا ترجمة مسبقة: رسالة السيرفر كما هي، وإلا
  /// وصف تقني إنجليزي محايد يعرفه friendlyError («Connection error»…) فيعرضه بلغة الواجهة.
  /// يبقى معه رمز HTTP ورمز خطأ السيرفر ونوع فشل النقل ([ApiExceptionDetails]).
  Never _throw(Object e) {
    if (e is ApiException) throw e;
    if (e is DioException) {
      final status = e.response?.statusCode;
      final data = e.response?.data;
      final parsed = parseApiErrorMessage(data)?.trim() ?? '';
      throw _DetailedApiException(
        parsed.isNotEmpty ? parsed : _fallbackMessage(e.type, status),
        status,
        code: _errorCode(data),
        type: e.type,
      );
    }
    throw ApiException(e.toString());
  }

  static String _fallbackMessage(DioExceptionType type, int? status) => switch (type) {
        DioExceptionType.connectionTimeout ||
        DioExceptionType.sendTimeout ||
        DioExceptionType.receiveTimeout =>
          'Connection timeout',
        DioExceptionType.connectionError => 'Connection error',
        DioExceptionType.cancel => 'Request cancelled',
        DioExceptionType.badCertificate => 'Secure connection failed',
        // unknown بلا رد = انقطاع أثناء الطلب (SocketException وأشباهه).
        _ => status != null ? 'Request failed (HTTP $status)' : 'Connection error',
      };

  /// رمز الخطأ من السيرفر ({error: {code}} أو {code}) — مثل WRONG_CURRENT_PASSWORD.
  static String? _errorCode(dynamic data) {
    if (data is! Map) return null;
    final err = data['error'];
    final raw = (err is Map ? err['code'] : null) ?? data['code'];
    final code = raw?.toString().trim() ?? '';
    return code.isEmpty ? null : code;
  }

  // ---- HOME ----
  static String _homeKey(String? worldSlug) => worldSlug == null ? 'home_v3' : 'home_v3_world_$worldSlug';

  /// هل وصلت واجهة هذا العالم من الشبكة خلال [within]؟ (لا داعي لإعادة طلبها فوراً)
  bool isHomeFresh({String? worldSlug, Duration within = AppConfig.homeCacheTtl}) =>
      _cache.isFresh(_homeKey(worldSlug), within);

  /// هل الواجهة المعروضة نسخة محفوظة لأن الشبكة فشلت؟ (لشارة «نسخة محفوظة»)
  bool homeServedStale({String? worldSlug}) => _cache.servedStale(_homeKey(worldSlug));

  /// وقت النسخة المعروضة من الواجهة («آخر تحديث قبل …»).
  DateTime? homeFetchedAt({String? worldSlug}) => _cache.fetchedAt(_homeKey(worldSlug));

  /// هل حُفظت واجهة هذا العالم خلال [within]؟ يقرأ وقت النسخة المحفوظة على القرص أيضاً
  /// (التجهيز المسبق لا يعيد تنزيل ما وصل قبل دقائق في تشغيل سابق).
  Future<bool> isHomeCachedWithin({String? worldSlug, required Duration within}) =>
      _cache.isStoredWithin(_homeKey(worldSlug), within);

  // ---- محوّلات الردود: ثابتة لا تلتقط شيئاً، فتُرسل إلى isolate مع الردود الكبيرة ----
  static HomeFeed _homeFeedFrom(dynamic data) => HomeFeed.fromJson(asMap(data));
  static List<Category> _categoriesFrom(dynamic data) =>
      asList(data).map((e) => Category.fromJson(asMap(e))).toList();
  static List<Brand> _brandsFrom(dynamic data) => asList(data).map((e) => Brand.fromJson(asMap(e))).toList();
  static Paginated<Product> _productPageFrom(dynamic data) => Paginated.fromJson(asMap(data), Product.fromJson);
  static Product _productFrom(dynamic data) => Product.fromJson(asMap(data));

  /// بيانات الكتالوج (الأقسام، البراندات، مناطق الشحن، الباقات، مشاكل البشرة) تتغير نادراً:
  /// المحفوظة تُعرض فوراً حتى عمر يوم تقريباً (5 دقائق × 288) وتُحدَّث في الخلفية —
  /// لا انتظار للشبكة عند كل فتح بارد للتطبيق.
  static const _catalogStaleFactor = 288;

  /// [staleOnError] = false (سحب للتحديث): فشل الشبكة يُرمى بدل إعادة النسخة المحفوظة،
  /// فيعرف المستدعي أن التحديث لم يتم.
  Future<HomeFeed> getHome({bool forceRefresh = false, String? worldSlug, bool staleOnError = true}) async {
    try {
      // الواجهة كبيرة (مئات KB): تُفكّ ويُبنى نموذجها في isolate، ونصها يُحفظ كما وصل.
      return await _cache.getOrFetchJson<HomeFeed>(
        key: _homeKey(worldSlug),
        ttl: AppConfig.homeCacheTtl,
        // الواجهة المحفوظة تُعرض فوراً حتى عمر يوم تقريباً (90ث × 960) وتُحدَّث في الخلفية —
        // لا هيكل تحميل عند كل فتح للتطبيق على شبكة بطيئة.
        maxStaleFactor: 960,
        forceRefresh: forceRefresh,
        staleOnError: staleOnError,
        unwrapData: true,
        fetchRaw: () => _getRaw('/home', query: worldSlug == null ? null : {'world': worldSlug}),
        parse: _homeFeedFrom,
      );
    } catch (e) {
      _throw(e);
    }
  }

  /// العوالم نادراً ما تتغير: تُعرض من الجهاز فوراً (وبلا إنترنت) وتُحدَّث في الخلفية.
  Future<List<StoreWorld>> getWorlds({bool forceRefresh = false, bool staleOnError = true}) async {
    try {
      final raw = await _cache.getOrFetch<List<dynamic>>(
        key: 'worlds_v1',
        ttl: const Duration(minutes: 10),
        maxStaleFactor: 1008, // حتى 7 أيام تُعرض فوراً مع تحديث خلفي
        forceRefresh: forceRefresh,
        staleOnError: staleOnError,
        fetch: () async {
          final r = await _dio.get('/worlds', options: Options(extra: {'auth': false}));
          return asList(_data(r));
        },
        parse: (json) => asList(json),
        serialize: (l) => l,
      );
      return raw.map((e) => StoreWorld.fromJson(asMap(e))).toList();
    } catch (e) {
      _throw(e);
    }
  }

  Future<StoreWorld> getWorld(String slug, {bool forceRefresh = false, bool staleOnError = true}) async {
    try {
      final raw = await _cache.getOrFetch<Map<String, dynamic>>(
        key: 'world_v1_$slug',
        ttl: const Duration(minutes: 10),
        maxStaleFactor: 1008,
        forceRefresh: forceRefresh,
        staleOnError: staleOnError,
        fetch: () async {
          final r = await _dio.get('/worlds/$slug', options: Options(extra: {'auth': false}));
          return asMap(_data(r));
        },
        parse: (json) => asMap(json),
        serialize: (m) => m,
      );
      return StoreWorld.fromJson(raw);
    } catch (e) {
      _throw(e);
    }
  }

  /// لا ترمي أبداً: بعد الفشل تُعاد المحاولة مرة واحدة فقط إن سقط الاتصال نفسه (لا بعد
  /// انتهاء مهلة — انتظرنا 25 ثانية أصلاً)، ثم عروض الواجهة الرئيسية المحفوظة.
  Future<HomeFeed> getOffers({bool forceRefresh = false}) async {
    try {
      return await _fetchOffers(forceRefresh: forceRefresh);
    } catch (e) {
      if (e is ApiException && e.transportType == DioExceptionType.connectionError) {
        try {
          await Future<void>.delayed(const Duration(milliseconds: 400));
          return await _fetchOffers(forceRefresh: true);
        } catch (_) {}
      }
      return _offersFallbackFromHome();
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
      return await _cache.getOrFetchJson<HomeFeed>(
        key: 'offers_v1',
        ttl: AppConfig.homeCacheTtl,
        // حتى ساعة تقريباً (90ث × 40) تُعرض فوراً وتُحدَّث في الخلفية.
        maxStaleFactor: 40,
        forceRefresh: forceRefresh,
        unwrapData: true,
        fetchRaw: () => _getRaw('/offers'),
        parse: _homeFeedFrom,
      );
    } catch (e) {
      _throw(e);
    }
  }

  // ---- CATEGORIES ----
  static const _categoriesKey = 'categories_all_v4';

  /// هل وصلت شجرة الأقسام (من الشبكة أو من نسخة محفوظة بهذا العمر) خلال [within]؟
  bool categoriesFresh({Duration within = AppConfig.catalogCacheTtl}) => _cache.isFresh(_categoriesKey, within);

  /// شجرة الأقسام النشطة فقط (بلا all=1: القسم الموقوف من لوحة التحكم يختفي من التطبيق).
  Future<List<Category>> getCategories({bool forceRefresh = false, bool staleOnError = true}) async {
    try {
      return await _cache.getOrFetchJson<List<Category>>(
        key: _categoriesKey,
        ttl: AppConfig.catalogCacheTtl,
        maxStaleFactor: _catalogStaleFactor,
        forceRefresh: forceRefresh,
        staleOnError: staleOnError,
        unwrapData: true,
        fetchRaw: () => _getRaw('/categories'),
        parse: _categoriesFrom,
      );
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
  /// [all] يطلب البراندات الموقوفة أيضاً — للوحة التحكم فقط (السيرفر يتجاهله لواجهات المتجر)،
  /// فالافتراضي false.
  Future<List<Brand>> getBrands({
    bool featured = false,
    bool all = false,
    String? categoryId,
    String? subcategoryId,
    bool forceRefresh = false,
    bool staleOnError = true,
  }) async {
    try {
      final key = categoryId != null
          ? 'brands_cat_$categoryId'
          : subcategoryId != null
              ? 'brands_sub_$subcategoryId'
              : 'brands_f${featured ? 1 : 0}_a${all ? 1 : 0}';
      return await _cache.getOrFetchJson<List<Brand>>(
        key: key,
        ttl: AppConfig.catalogCacheTtl,
        maxStaleFactor: _catalogStaleFactor,
        forceRefresh: forceRefresh,
        staleOnError: staleOnError,
        unwrapData: true,
        fetchRaw: () => _getRaw('/brands', query: {
          if (featured) 'featured': '1',
          if (all) 'all': '1',
          if (categoryId != null) 'categoryId': categoryId,
          if (subcategoryId != null) 'subcategoryId': subcategoryId,
        }),
        parse: _brandsFrom,
      );
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
  /// قائمة منتجات بفلاتر الخادم. كلها اختيارية:
  /// - [world]: slug عالم — منتجات أقسامه فقط («عرض الكل» وشرائح الميزانية داخل العالم).
  /// - [ids]: منتجات بعينها (يُستخدم معها [getProductsByIds] غالباً).
  /// - [minDiscount]: خصم لا يقل عن هذه النسبة (شرائح العروض)، و`sort: 'discount'` للأعلى خصماً.
  /// - [skinType]: نوع البشرة (dry | oily | combination | normal | sensitive).
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
    String? world,
    List<String>? ids,
    int? minDiscount,
    String? skinType,
    bool lite = true,
    bool forceRefresh = false,
    bool staleOnError = true,
  }) async {
    try {
      final worldSlug = _nonEmpty(world);
      final skin = _nonEmpty(skinType);
      final idList = ids?.map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
      // الخادم يقبل 1–90%.
      final discount = (minDiscount != null && minDiscount > 0) ? minDiscount.clamp(1, 90) : null;
      final cacheKey = _productsCacheKey(
        page: page,
        limit: limit,
        search: search,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        tertiaryCategoryId: tertiaryCategoryId,
        brandId: brandId,
        sort: sort,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minRating: minRating,
        inStock: inStock,
        isNew: isNew,
        isBestSeller: isBestSeller,
        isPromo: isPromo,
        concernSlug: concernSlug,
        isFeatured: isFeatured,
        world: worldSlug,
        ids: idList,
        minDiscount: discount,
        skinType: skin,
        lite: lite,
      );

      final query = <String, dynamic>{
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
        if (worldSlug != null) 'world': worldSlug,
        if (idList != null && idList.isNotEmpty) 'ids': idList.join(','),
        if (discount != null) 'minDiscount': discount,
        if (skin != null) 'skinType': skin,
      };

      if (cacheKey != null) {
        return await _cache.getOrFetchJson<Paginated<Product>>(
          key: cacheKey,
          ttl: AppConfig.listingCacheTtl,
          forceRefresh: forceRefresh,
          staleOnError: staleOnError,
          fetchRaw: () => _getRaw('/products', query: query),
          parse: _productPageFrom,
        );
      }

      final r = await _dio.get('/products', queryParameters: query, options: Options(extra: {'auth': false}));
      return Paginated.fromJson(_body(r), Product.fromJson);
    } catch (e) {
      _throw(e);
    }
  }

  /// منتجات بعينها بترتيب [ids] (تابعي التسوق، المقارنة، تنبيهات التوفّر) — السعر والمخزون
  /// والتدرجات الحالية من الخادم. ما حُذف أو أُوقف يسقط من النتيجة.
  ///
  /// [staleOnError] = false: فشل الشبكة يُرمى بدل النسخة المحفوظة — للمستدعي الذي يبني على
  /// غياب منتج من النتيجة (السلة، «شاهدتِها مؤخراً») فلا يعدّ نسخة قديمة تحققاً.
  Future<List<Product>> getProductsByIds(
    List<String> ids, {
    bool forceRefresh = false,
    bool staleOnError = true,
  }) async {
    final wanted = <String>[];
    for (final raw in ids) {
      final id = raw.trim();
      if (id.isNotEmpty && !wanted.contains(id)) wanted.add(id);
    }
    if (wanted.isEmpty) return const [];
    // الخادم يأخذ أول 50 معرّفاً في الطلب الواحد.
    final batches = [
      for (var i = 0; i < wanted.length; i += _idsPerRequest)
        wanted.sublist(i, math.min(i + _idsPerRequest, wanted.length)),
    ];
    final pages = await Future.wait(
      batches.map((batch) => getProducts(
            ids: batch,
            limit: batch.length,
            forceRefresh: forceRefresh,
            staleOnError: staleOnError,
          )),
    );
    final byId = {for (final page in pages) for (final p in page.items) p.id: p};
    return [for (final id in wanted) ?byId[id]];
  }

  static const _idsPerRequest = 50;

  /// بحث ذكي للمتجر — ترتيب بالملاءمة، عربي/إنجليزي معاً. [world] يحصر النتائج بأقسام عالم.
  Future<Paginated<Product>> searchProducts(String query, {int limit = 40, String? world}) async {
    try {
      final q = query.trim();
      if (q.length < 2) return Paginated.empty();
      final worldSlug = _nonEmpty(world);
      final r = await _dio.get(
        '/products/search',
        queryParameters: {'q': q, 'limit': limit, if (worldSlug != null) 'world': worldSlug},
        options: Options(extra: {'auth': false}),
      );
      return Paginated.fromJson(_body(r), Product.fromJson);
    } catch (e) {
      _throw(e);
    }
  }

  /// مفتاح كاش الصفحة الأولى — يضم كل ما يغيّر النتيجة، فلا تُعرض قائمة مفلترة مكان
  /// غير المفلترة عند انقطاع الشبكة. البحث النصي لا يُحفظ.
  String? _productsCacheKey({
    required int page,
    required int limit,
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
    String? world,
    List<String>? ids,
    int? minDiscount,
    String? skinType,
    bool lite = true,
  }) {
    if (page != 1) return null;
    if (search != null && search.isNotEmpty) return null;
    final parts = <String>[
      // v4: مفاتيح v3 لم تكن تميّز فلاتر السعر والتقييم والمخزون — تُهمَل.
      'products_v4',
      'l$limit',
      if (categoryId != null) 'c$categoryId',
      if (subcategoryId != null) 'sc$subcategoryId',
      if (tertiaryCategoryId != null) 'tc$tertiaryCategoryId',
      if (brandId != null) 'b$brandId',
      if (sort != null) 's$sort',
      if (minPrice != null) 'min$minPrice',
      if (maxPrice != null) 'max$maxPrice',
      if (minRating != null) 'r$minRating',
      if (inStock == true) 'stock',
      if (isNew == true) 'new',
      if (isBestSeller == true) 'best',
      if (isPromo == true) 'promo',
      if (isFeatured == true) 'feat',
      if (concernSlug != null && concernSlug.isNotEmpty) 'cn$concernSlug',
      if (world != null) 'w$world',
      if (ids != null && ids.isNotEmpty) 'ids${ids.join(',')}',
      if (minDiscount != null) 'd$minDiscount',
      if (skinType != null) 'sk$skinType',
      if (!lite) 'full',
    ];
    return parts.join('_');
  }

  Future<BarcodeLookupResult?> lookupProductByBarcode(String raw) async {
    try {
      final r = await _dio.get(
        '/products/lookup/barcode',
        queryParameters: {'code': raw},
        options: Options(extra: {'auth': false}),
      );
      return BarcodeLookupResult.fromJson(asMap(_data(r)));
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) return null;
      _throw(e);
    }
  }

  /// هل جُلب المنتج من الشبكة للتو؟ (لا داعي لإعادة طلبه فوراً)
  bool isProductFresh(String idOrSlug) =>
      _cache.isFresh('product_v2_$idOrSlug', const Duration(seconds: 20));

  Future<Product> getProduct(String idOrSlug, {bool forceRefresh = false}) async {
    try {
      return await _cache.getOrFetchJson<Product>(
        key: 'product_v2_$idOrSlug',
        ttl: AppConfig.productCacheTtl,
        forceRefresh: forceRefresh,
        unwrapData: true,
        fetchRaw: () => _getRaw('/products/$idOrSlug'),
        parse: _productFrom,
      );
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

  /// صفحة تقييمات مرتبة ([sort]: newest | highest | lowest) مع العدد الكلي، وتقييم
  /// الزبونة نفسها ([mine]) إن كانت مسجّلة الدخول — يُرسل الرمز إن وُجد.
  Future<({Paginated<Review> page, Review? mine})> getProductReviewsPage(
    String productId, {
    int page = 1,
    int limit = 10,
    String sort = 'newest',
  }) async {
    try {
      final r = await _dio.get('/reviews/product/$productId', queryParameters: {
        'page': page,
        'limit': limit,
        'sort': sort,
      });
      var body = _body(r);
      // الشكل الجديد {items, meta, mine}؛ القديم {data, meta}؛ وقد يُغلَّف بـ data.
      if (body['items'] == null && body['meta'] == null && body['data'] is Map) body = asMap(body['data']);
      final meta = asMap(body['meta']);
      final items = asList(body['items'] ?? body['data']).map(Review.fromJson).toList();
      final current = asInt(meta['page'], page);
      final totalPages = asInt(meta['totalPages'], 1);
      return (
        page: Paginated<Review>(
          items: items,
          total: asInt(meta['total'], items.length),
          page: current,
          totalPages: totalPages,
          hasNext: meta['hasNext'] == null ? current < totalPages : asBool(meta['hasNext']),
        ),
        mine: body['mine'] is Map ? Review.fromJson(asMap(body['mine'])) : null,
      );
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

  /// تغيير كلمة المرور يُنهي كل الجلسات على الخادم. السيرفر الحديث يُرجع رموزاً جديدة
  /// (accessToken / refreshToken) لهذه الجلسة — يحفظها المستدعي؛ القديم يُرجع {success}.
  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final r = await _dio.post('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
      return asMap(_data(r));
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

  /// قلب على الخادم — غير آمن مع قائمة محلية ناقصة؛ استخدمي [addToWishlist] / [removeFromWishlist].
  Future<bool> toggleWishlist(String productId) async {
    try {
      final r = await _dio.post('/wishlist/$productId/toggle');
      return asBool(asMap(_data(r))['added']);
    } catch (e) {
      _throw(e);
    }
  }

  /// إضافة صريحة (تكرارها آمن). يُرجع المنتج كما تعرضه المفضلة (صور، براند، تدرجات)
  /// إن أرسله الخادم.
  Future<Product?> addToWishlist(String productId) async {
    try {
      final r = await _dio.post('/wishlist/${Uri.encodeComponent(productId)}');
      final product = asMap(asMap(_data(r))['product']);
      if (product.isEmpty) return null;
      final p = Product.fromJson(product);
      return p.id.isEmpty ? null : p;
    } catch (e) {
      _throw(e);
    }
  }

  /// إزالة صريحة (تكرارها آمن).
  Future<void> removeFromWishlist(String productId) async {
    try {
      await _dio.delete('/wishlist/${Uri.encodeComponent(productId)}');
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

  /// [clearMissing] (تعديل من دفتر العناوين): الحقول الاختيارية الفارغة تُمسح على الخادم
  /// (منطقة محافظة سابقة، ملاحظة حُذفت). بدونه يبقى الغائب كما هو — مسار الدفع الذي
  /// لا يعرف كل حقول العنوان المحفوظ (الملاحظات مثلاً) فلا يمسحها.
  Future<Address> updateAddress(String id, Address address, {bool clearMissing = false}) async {
    try {
      final r = await _dio.patch('/addresses/$id', data: clearMissing ? address.toPatchJson() : address.toJson());
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
  /// المحافظات ومناطقها — محفوظة على الجهاز: انقطاع واحد لا يحوّل اختيار المحافظة
  /// إلى حقل نص حر في الدفع ودفتر العناوين.
  Future<List<Map<String, dynamic>>> getShippingZones({bool forceRefresh = false, bool staleOnError = true}) async {
    try {
      return await _cache.getOrFetch<List<Map<String, dynamic>>>(
        key: 'shipping_zones_v1',
        ttl: AppConfig.catalogCacheTtl,
        maxStaleFactor: _catalogStaleFactor,
        forceRefresh: forceRefresh,
        staleOnError: staleOnError,
        fetch: () async {
          final r = await _dio.get('/shipping/zones', options: Options(extra: {'auth': false}));
          return asList(_data(r));
        },
        parse: (json) => asList(json),
        serialize: (list) => list,
      );
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
  /// هل يوجد تحديث للتطبيق؟ mode: none | soft | force (من إعدادات لوحة التحكم).
  Future<Map<String, dynamic>> checkAppUpdate({required String platform, required String version}) async {
    try {
      final r = await _dio.get('/app/update',
          queryParameters: {'platform': platform, 'version': version}, options: Options(extra: {'auth': false}));
      return asMap(_data(r));
    } catch (e) {
      _throw(e);
    }
  }

  // ---- الباقات والروتين ودليل البشرة ----
  /// صفحة باقة/روتين: المنتجات والخطوات والتوفير، وباقات مشابهة.
  Future<BeautyPackage> getPackage(String idOrSlug) async {
    try {
      final r = await _dio.get('/packages/${Uri.encodeComponent(idOrSlug)}', options: Options(extra: {'auth': false}));
      return BeautyPackage.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  /// الباقات الصالحة الآن. kind: routines | bundles | ROUTINE_MORNING | ROUTINE_EVENING | BRIDAL_KIT …
  /// [forceRefresh] للسحب للتحديث: من الشبكة الآن (وبلا اتصال تبقى النسخة المحفوظة).
  Future<List<BeautyPackage>> getPackages({
    String? world,
    String? kind,
    String? concern,
    String? skinType,
    bool forceRefresh = false,
  }) async {
    try {
      final key = 'packages_v2_${world ?? '-'}_${kind ?? '-'}_${concern ?? '-'}_${skinType ?? '-'}';
      final raw = await _cache.getOrFetch<List<dynamic>>(
        key: key,
        ttl: AppConfig.catalogCacheTtl,
        maxStaleFactor: _catalogStaleFactor,
        forceRefresh: forceRefresh,
        fetch: () async {
          final r = await _dio.get('/packages', queryParameters: {
            if (world != null) 'world': world,
            if (kind != null) 'kind': kind,
            if (concern != null) 'concern': concern,
            if (skinType != null) 'skinType': skinType,
          }, options: Options(extra: {'auth': false}));
          return asList(_data(r));
        },
        parse: (json) => asList(json),
        serialize: (list) => list,
      );
      return raw.map((e) => BeautyPackage.fromJson(asMap(e))).toList();
    } catch (e) {
      _throw(e);
    }
  }

  /// مشاكل البشرة لعالم معيّن (مع عدد المنتجات). [forceRefresh] للسحب للتحديث.
  Future<List<SkinConcern>> getSkinConcerns({String? world, bool forceRefresh = false}) async {
    try {
      final raw = await _cache.getOrFetch<List<dynamic>>(
        key: 'skin_concerns_v2_${world ?? '-'}',
        ttl: AppConfig.catalogCacheTtl,
        maxStaleFactor: _catalogStaleFactor,
        forceRefresh: forceRefresh,
        fetch: () async {
          final r = await _dio.get('/skin-concerns',
              queryParameters: {if (world != null) 'world': world}, options: Options(extra: {'auth': false}));
          return asList(_data(r));
        },
        parse: (json) => asList(json),
        serialize: (list) => list,
      );
      return raw.map((e) => SkinConcern.fromJson(asMap(e))).toList();
    } catch (e) {
      _throw(e);
    }
  }

  /// صفحة الدليل لمشكلة: المحتوى، المنتجات، الروتينات المناسبة.
  Future<SkinGuide> getSkinGuide(String slug, {String? world}) async {
    try {
      final r = await _dio.get('/skin-guide/${Uri.encodeComponent(slug)}',
          queryParameters: {if (world != null) 'world': world}, options: Options(extra: {'auth': false}));
      return SkinGuide.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  /// ملف «ديما» المحفوظ على الحساب — لاستعادة نوع البشرة بعد تسجيل الدخول على جهاز جديد.
  Future<AssistantProfileData> getAssistantProfile() async {
    try {
      final r = await _dio.get('/assistant/profile');
      return _assistantProfile(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  /// حفظ نتيجة اختبار البشرة على الحساب (تبقى بعد إعادة التثبيت وعلى أي جهاز).
  /// الحقل null لا يُرسل فيبقى كما هو؛ `skinType: ''` يمسح نوع البشرة، والحساسيات تستبدل القائمة.
  Future<AssistantProfileData> updateAssistantProfile({String? skinType, List<String>? sensitivities}) async {
    try {
      final r = await _dio.patch('/assistant/profile', data: {
        if (skinType != null) 'skinType': skinType.trim(),
        if (sensitivities != null) 'sensitivities': sensitivities,
      });
      return _assistantProfile(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  static AssistantProfileData _assistantProfile(Map<String, dynamic> m) => (
        skinType: _nonEmpty(m['skinType']?.toString()),
        sensitivities: asStringList(m['sensitivities']).where((e) => e.trim().isNotEmpty).toList(),
      );

  /// نتيجة اختبار البشرة.
  Future<SkinMatch> matchSkin({String? skinType, List<String> concerns = const [], String? world}) async {
    try {
      final r = await _dio.get('/skin-guide/match', queryParameters: {
        if (skinType != null) 'skinType': skinType,
        if (concerns.isNotEmpty) 'concerns': concerns.join(','),
        if (world != null) 'world': world,
      }, options: Options(extra: {'auth': false}));
      return SkinMatch.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  // ---- COUPONS ----
  /// كوبونات الصفحة الرئيسية (الظاهرة والصالحة الآن) — لعالم معيّن إن وُجد.
  Future<List<Coupon>> getFeaturedCoupons({String? world}) async {
    try {
      final r = await _dio.get('/coupons/featured', queryParameters: {if (world != null) 'world': world});
      return asList(_data(r)).map((e) => Coupon.fromJson(asMap(e))).where((c) => c.code.isNotEmpty).toList();
    } catch (e) {
      _throw(e);
    }
  }

  /// تحقق مع سبب الرفض («انتهت صلاحية الكود»، «لأول طلب فقط»…).
  Future<({Coupon? coupon, String? reason})> checkCoupon(String code) async {
    final trimmed = code.trim();
    if (trimmed.isEmpty) return (coupon: null, reason: null);
    try {
      final r = await _dio.get('/coupons/check/${Uri.encodeComponent(trimmed)}');
      final m = asMap(_data(r));
      if (m['ok'] == true && m['coupon'] is Map) return (coupon: Coupon.fromJson(asMap(m['coupon'])), reason: null);
      return (coupon: null, reason: m['reason']?.toString());
    } catch (e) {
      _throw(e);
    }
  }

  Future<Coupon?> validateCoupon(String code) async {
    final trimmed = code.trim();
    if (trimmed.isEmpty) return null;
    try {
      final r = await _dio.get(
        '/coupons/validate/${Uri.encodeComponent(trimmed)}',
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
  /// طلباتي. [preview]: أول 6 منتجات لكل طلب (صور مصغّرة واسم أول منتج في البطاقة) مع
  /// العدد الكلي في `_count`. [status]: حالة واحدة (PENDING، SHIPPED…) أو null للكل.
  Future<Paginated<AppOrder>> getOrders({int page = 1, int limit = 20, String? status, bool preview = true}) async {
    try {
      final st = _nonEmpty(status);
      final r = await _dio.get('/orders', queryParameters: {
        'page': page,
        'limit': limit,
        if (preview) 'preview': true,
        if (st != null) 'status': st,
      });
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
    List<Map<String, dynamic>> packages = const [],
    bool isGift = false,
    String? giftMessage,
    bool giftHidePrices = false,
    String? clientRef,
  }) async {
    // مفتاح محاولة الإتمام: إعادة الإرسال بعد انقطاع بنفس المفتاح تُرجع الطلب نفسه بدل
    // طلب ثانٍ (خصم مخزون وكوبون مكرر). الخادم يقبل حتى 64 حرفاً.
    final attemptRef = _nonEmpty(clientRef);
    final orderRef = attemptRef != null && attemptRef.length > 64 ? attemptRef.substring(0, 64) : attemptRef;
    try {
      final r = await _dio.post('/orders', data: {
        if (orderRef != null) 'clientRef': orderRef,
        'items': items,
        // باقات مكتملة في السلة — السيرفر يتحقق منها ويطبّق سعرها الخاص.
        if (packages.isNotEmpty) 'packages': packages,
        'paymentMethod': paymentMethod,
        'deliveryOption': deliveryOption,
        if (addressId != null) 'addressId': addressId,
        if (couponCode != null && couponCode.isNotEmpty) 'couponCode': couponCode,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (isGift) 'isGift': true,
        if (isGift && giftMessage != null && giftMessage.isNotEmpty) 'giftMessage': giftMessage,
        if (isGift) 'giftHidePrices': giftHidePrices,
        if (loyaltySpent > 0) 'loyaltySpent': loyaltySpent,
      });
      return AppOrder.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  /// «اطلبيها مرة ثانية» — مشترياتها السابقة المتوفرة الآن (تحتاج تسجيل الدخول).
  Future<List<Product>> getBuyAgain({int limit = 12}) async {
    try {
      final r = await _dio.get('/products/me/buy-again', queryParameters: {'limit': limit});
      return asList(_data(r)).map((e) => Product.fromJson(asMap(e))).toList();
    } catch (e) {
      _throw(e);
    }
  }

  /// «يُشترى معه غالباً» — من طلبات المتجر الفعلية، أو مكمّلات من نفس البراند.
  Future<({List<Product> items, bool fromOrders})> getBoughtTogether(String productId) async {
    try {
      final r = await _dio.get('/products/$productId/bought-together', queryParameters: {'limit': 8});
      final body = asMap(_data(r));
      return (
        items: asList(body['items']).map((e) => Product.fromJson(asMap(e))).toList(),
        fromOrders: body['source'] == 'orders',
      );
    } catch (e) {
      _throw(e);
    }
  }

  // ---- ADVISOR (ديما) ----
  Future<Map<String, dynamic>> advisorWelcome({String? name}) async {
    try {
      // الاسم في جسم الطلب لا في الرابط.
      // مع رمز الدخول إن وُجد: «ديما» تعرف مشترياتها (تجديد، روتين ناقص).
      final r = await _dio.post('/advisor/welcome', data: {if (name != null && name.isNotEmpty) 'firstName': name});
      return asMap(_data(r));
    } catch (e) {
      _throw(e);
    }
  }

  Future<Map<String, dynamic>> advisorChat({
    String? message,
    String? action,
    Map<String, dynamic>? state,
    String? firstName,
    Map<String, dynamic>? profile,
    String? productId,
  }) async {
    try {
      final r = await _dio.post('/advisor/chat',
          data: {
            if (message != null) 'message': message,
            if (action != null) 'action': action,
            if (state != null) 'state': state,
            if (firstName != null && firstName.isNotEmpty) 'firstName': firstName,
            if (profile != null && profile.isNotEmpty) 'profile': profile,
            if (productId != null) 'productId': productId,
          });
      return asMap(_data(r));
    } catch (e) {
      _throw(e);
    }
  }

  /// إشارة تعلّم مجهولة الهوية (فتح/إضافة/إعجاب) — لا تُعيد خطأ للواجهة.
  Future<void> advisorFeedback({required String type, String? productId, String? sig}) async {
    try {
      await _dio.post('/advisor/feedback',
          data: {'type': type, if (productId != null) 'productId': productId, if (sig != null && sig.isNotEmpty) 'sig': sig},
          options: Options(extra: {'auth': false}));
    } catch (_) {}
  }

  // ---- PRODUCT ALERTS ----
  Future<Set<String>> getRestockWatches() async {
    try {
      final r = await _dio.get('/alerts/mine');
      return asList(asMap(_data(r))['restock']).map((e) => e.toString()).toSet();
    } catch (e) {
      _throw(e);
    }
  }

  Future<void> setRestockWatch(String productId, bool watch) async {
    try {
      if (watch) {
        await _dio.post('/alerts/restock/$productId');
      } else {
        await _dio.delete('/alerts/restock/$productId');
      }
    } catch (e) {
      _throw(e);
    }
  }

  // ---- PAYMENTS (QiCard) ----
  Future<PaymentMethodsConfig> getPaymentMethods() async {
    try {
      final r = await _dio.get('/payments/methods');
      return PaymentMethodsConfig.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<CardPaymentSession> startCardPayment(String orderId) async {
    try {
      final r = await _dio.post('/payments/orders/$orderId/start');
      return CardPaymentSession.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<OrderPaymentState> confirmCardPayment(String orderId) async {
    try {
      final r = await _dio.post('/payments/orders/$orderId/confirm');
      return OrderPaymentState.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  Future<OrderPaymentState> abandonCardPayment(String orderId, {String? transactionId}) async {
    try {
      final r = await _dio.post(
        '/payments/orders/$orderId/abandon',
        data: {if (transactionId != null && transactionId.isNotEmpty) 'transactionId': transactionId},
      );
      return OrderPaymentState.fromJson(asMap(_data(r)));
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

  // ---- SEARCH (v2: محرك في الذاكرة) ----
  /// لغة البحث كما يفهمها السيرفر (ar | en) — أسماء المنتجات والأقسام بلغة الواجهة.
  static String? _searchLang(String? lang) => lang == null ? null : (lang == 'en' ? 'en' : 'ar');

  /// اقتراحات فورية أثناء الكتابة — إكمالات + براندات + أقسام + منتجات.
  /// [lang] لأسماء بلغة الواجهة، و[world] لحصرها بعالم.
  Future<SearchInstant> searchInstant(
    String q, {
    CancelToken? cancelToken,
    String? lang,
    String? world,
  }) async {
    try {
      final l = _searchLang(lang);
      final w = _nonEmpty(world);
      final r = await _dio.get(
        '/search/instant',
        queryParameters: {'q': q, if (l != null) 'lang': l, if (w != null) 'world': w},
        cancelToken: cancelToken,
        options: Options(extra: {'auth': false}),
      );
      return SearchInstant.fromJson(asMap(_data(r)));
    } catch (e) {
      _throw(e);
    }
  }

  /// صفحة نتائج مرتبة بالملاءمة مع الفلاتر وعدّاداتها. [lang] و[world] كما في [searchInstant].
  Future<SearchPage> searchPage(
    String q,
    SearchFilters filters, {
    int page = 1,
    int limit = 24,
    CancelToken? cancelToken,
    String? lang,
    String? world,
  }) async {
    try {
      final l = _searchLang(lang);
      final w = _nonEmpty(world);
      final r = await _dio.get(
        '/search',
        queryParameters: {
          'q': q,
          'page': page,
          'limit': limit,
          ...filters.toQuery(),
          if (l != null) 'lang': l,
          if (w != null) 'world': w,
        },
        cancelToken: cancelToken,
        options: Options(extra: {'auth': false}),
      );
      return SearchPage.fromJson(_body(r));
    } catch (e) {
      _throw(e);
    }
  }

  /// الأكثر بحثاً فعلاً (من سجل البحث على الخادم). فارغة إن لم يدعمها الخادم بعد أو تعذّر
  /// الوصول — الواجهة تعرض قائمتها الثابتة بدلها.
  Future<List<String>> getTrendingSearches({String? lang}) async {
    final l = _searchLang(lang) ?? 'ar';
    try {
      return await _cache.getOrFetch<List<String>>(
        key: 'search_trending_v1_$l',
        ttl: const Duration(minutes: 10),
        maxStaleFactor: 144, // حتى يوم تُعرض فوراً مع تحديث خلفي
        fetch: () async {
          final r = await _dio.get(
            '/search/trending',
            queryParameters: {'lang': l},
            options: Options(extra: {'auth': false}),
          );
          return _trendingTerms(_data(r));
        },
        parse: _trendingTerms,
        serialize: (terms) => terms,
      );
    } catch (_) {
      return const [];
    }
  }

  /// ['سيروم', …] أو [{q|term|text|query: 'سيروم', count}, …] أو {items: […]}.
  static List<String> _trendingTerms(dynamic raw) {
    final list = raw is Map ? (raw['items'] ?? raw['terms'] ?? raw['data']) : raw;
    if (list is! List) return const [];
    final out = <String>[];
    for (final e in list) {
      final term = (e is Map ? (e['q'] ?? e['term'] ?? e['text'] ?? e['query']) : e)?.toString().trim() ?? '';
      if (term.isNotEmpty && !out.contains(term)) out.add(term);
    }
    return out;
  }
}

final apiServiceProvider = Provider<ApiService>(
  (ref) => ApiService(ref.read(dioProvider), ref.read(apiCacheProvider)),
);

/// ملف «ديما» على الحساب: نوع البشرة (dry | oily | combination | normal | sensitive) والحساسيات.
typedef AssistantProfileData = ({String? skinType, List<String> sensitivities});

/// [ApiException] من طلب HTTP مع تفاصيله — تُقرأ عبر [ApiExceptionDetails].
class _DetailedApiException extends ApiException {
  const _DetailedApiException(super.message, super.status, {this.code, this.type});

  final String? code;
  final DioExceptionType? type;
}

/// تفاصيل خطأ الطلب على أي [ApiException] (null لما لم يأتِ من طلب HTTP).
extension ApiExceptionDetails on ApiException {
  /// رمز الخطأ من السيرفر — مثل WRONG_CURRENT_PASSWORD أو NotFoundException.
  String? get code => switch (this) {
        _DetailedApiException(:final code) => code,
        _ => null,
      };

  /// نوع فشل الطلب في Dio (انتهاء مهلة، لا اتصال، رد خطأ…).
  DioExceptionType? get transportType => switch (this) {
        _DetailedApiException(:final type) => type,
        _ => null,
      };

  /// لم يصل رد من الخادم (لا اتصال أو انتهت المهلة) — قد يكون الطلب نُفّذ أو لا؛
  /// إعادة إرسال آمنة فقط مع مفتاح تكرار (مثل clientRef في الطلب).
  bool get isConnectionProblem {
    final type = transportType;
    if (type == null) return false;
    return switch (type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.connectionError =>
        true,
      DioExceptionType.unknown => status == null,
      _ => false,
    };
  }
}
