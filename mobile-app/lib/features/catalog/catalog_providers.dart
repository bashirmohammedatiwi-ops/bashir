import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/loyalty_rules.dart';
import '../../data/models/loyalty_summary.dart';
import '../../data/models/product.dart';
import '../../data/models/review.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';
import '../cart/cart_provider.dart';
import '../worlds/worlds_provider.dart';

/// يُبقي نتيجة مزوّد autoDispose حيّة مدة [ttl] (عودة سريعة بلا إعادة تحميل)،
/// لكنه لا يُبقي الخطأ أبداً: عند الفشل يُغلق الرابط فيُعاد الطلب في المرة القادمة
/// بدل خطأ عالق طوال الجلسة.
Future<T> keepAliveFor<T>(Ref<Object?> ref, Duration ttl, Future<T> Function() load) async {
  final link = ref.keepAlive();
  final timer = Timer(ttl, link.close);
  ref.onDispose(timer.cancel);
  try {
    return await load();
  } catch (_) {
    link.close();
    rethrow;
  }
}

const _shelfTtl = Duration(minutes: 5);

final homeFeedProvider = FutureProvider.autoDispose<HomeFeed>((ref) {
  ref.keepAlive();
  return ref.read(apiServiceProvider).getHome();
});

final offersFeedProvider = FutureProvider.autoDispose<HomeFeed>((ref) async {
  ref.keepAlive();
  final api = ref.read(apiServiceProvider);
  try {
    return await api.getOffers();
  } catch (_) {
    return api.getHome().then((home) => HomeFeed(
          sections: const [],
          flashSale: home.flashSale,
          promoProducts: home.promoProducts.isNotEmpty
              ? home.promoProducts
              : home.flashSale.products,
          settings: home.settings,
        )).catchError((_) => const HomeFeed());
  }
});

/// تحديث الشجرة من الشبكة مرة واحدة في الجلسة — حارس يمنع حلقة الإبطال.
bool _categoriesRevalidated = false;

/// مفاتيح كاش الشجرة في ApiService (v4 بلا all=1، وv3 قبلها) — لمعرفة هل وصلت
/// للتو من الشبكة.
const _categoriesCacheKeys = ['categories_all_v4', 'categories_all_v3'];

bool _categoriesJustFetched(Ref<Object?> ref) {
  final cache = ref.read(apiCacheProvider);
  return _categoriesCacheKeys.any((key) => cache.isFresh(key, const Duration(seconds: 30)));
}

/// الأقسام: من الجهاز فوراً، ثم تحديث واحد من الشبكة في الخلفية يُعيد بناء المزوّد
/// بالشجرة الجديدة (تغييرات لوحة التحكم تظهر دون انتظار الشبكة عند الفتح).
final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final first = await api.getCategories();
  if (!_categoriesRevalidated) {
    _categoriesRevalidated = true;
    // وصلت للتو من الشبكة (لا كاش صالح): لا داعي لتنزيلها مرة ثانية.
    if (!_categoriesJustFetched(ref)) {
      unawaited(api.getCategories(forceRefresh: true).then((_) {
        // بلا اتصال يعيد الكاش القديم نفسه: لا إعادة بناء بلا جديد.
        if (_categoriesJustFetched(ref)) ref.invalidateSelf();
      }).catchError((_) {}));
    }
  }
  return first;
});

/// إعادة تحميل الأقسام من السيرفر مباشرة (يسحب للتحديث / إعادة المحاولة).
/// تنزيل واحد: المزوّد يُعاد بناؤه من الكاش الذي وصل للتو.
Future<List<Category>> refreshCategories(WidgetRef ref) async {
  await ref.read(apiServiceProvider).getCategories(forceRefresh: true);
  ref.invalidate(categoriesProvider);
  return ref.read(categoriesProvider.future);
}

final brandsProvider = FutureProvider<List<Brand>>((ref) {
  ref.keepAlive();
  return ref.read(apiServiceProvider).getBrands(all: true);
});

/// براندات مرتبطة بقسم رئيسي (تبقى 5 دقائق؛ الخطأ لا يبقى).
final categoryBrandsProvider =
    FutureProvider.autoDispose.family<List<Brand>, String>((ref, categoryId) {
  return keepAliveFor(
    ref,
    _shelfTtl,
    () => ref.read(apiServiceProvider).getBrands(categoryId: categoryId),
  );
});

/// براندات مرتبطة بقسم فرعي (تبقى 5 دقائق؛ الخطأ لا يبقى).
final subcategoryBrandsProvider =
    FutureProvider.autoDispose.family<List<Brand>, String>((ref, subcategoryId) {
  return keepAliveFor(
    ref,
    _shelfTtl,
    () => ref.read(apiServiceProvider).getBrands(subcategoryId: subcategoryId),
  );
});

/// بصمة ما يتغيّر في صفحة المنتج دون تغيير رابطها: التقييم، السعر، المخزون والصور.
String _productDetailStamp(Product p) => [
      p.rating,
      p.reviewCount,
      p.price,
      p.originalPrice,
      p.stock,
      p.coverUrl,
      p.galleryUrls.join(','),
    ].join('|');

final productDetailProvider =
    FutureProvider.family.autoDispose<Product, String>((ref, idOrSlug) async {
  final api = ref.read(apiServiceProvider);
  final product = await api.getProduct(idOrSlug, forceRefresh: false);
  // وصل من الشبكة للتو: لا طلب ثانٍ. أما إن جاء من الكاش فنتحقق بهدوء من نسخة أحدث
  // (تقييم جديد، سعر، مخزون أو صور) ونعيد البناء فقط إن تغيّر شيء منها.
  if (api.isProductFresh(idOrSlug)) return product;

  final stamp = _productDetailStamp(product);
  unawaited(() async {
    try {
      final fresh = await api.getProduct(idOrSlug, forceRefresh: true);
      if (_productDetailStamp(fresh) != stamp) ref.invalidateSelf();
    } catch (_) {}
  }());

  return product;
});

final loyaltyProvider = FutureProvider.autoDispose<LoyaltySummary>((ref) {
  return ref.read(apiServiceProvider).getLoyalty();
});

final productReviewsProvider =
    FutureProvider.family.autoDispose<List<Review>, String>((ref, productId) async {
  return ref.read(apiServiceProvider).getProductReviews(productId);
});

/// «اطلبيها مرة ثانية»: فارغة للزائرة؛ للمسجّلة من طلباتها.
/// تتجدد فقط حين تتغير الزبونة (لا مع كل تحديث لبيانات الحساب)، وتبقى 5 دقائق
/// حتى لا يُعاد الطلب كلما خرج الرف من الشاشة وعاد.
final buyAgainProvider = FutureProvider.autoDispose<List<Product>>((ref) {
  final uid = ref.watch(authProvider.select((a) => a.isAuthenticated ? a.user?.id : null));
  if (uid == null) return Future.value(const <Product>[]);
  return keepAliveFor(ref, _shelfTtl, () => ref.read(apiServiceProvider).getBuyAgain());
});

/// «يُشترى معه غالباً»: من طلبات الزبونات، وإلا من البراند نفسه (المتوفر فقط).
final boughtTogetherProvider = FutureProvider.autoDispose
    .family<({List<Product> items, bool fromOrders}), String>((ref, productId) {
  return ref.read(apiServiceProvider).getBoughtTogether(productId);
});

/// مفتاح [similarProductsProvider]: أقسام المنتج الثلاثة (الأعمق أولاً عند الطلب) والمنتج المستثنى.
typedef SimilarProductsKey = ({
  String? categoryId,
  String? subcategoryId,
  String? tertiaryCategoryId,
  String excludeId,
});

/// أقل عدد يُعرض من القسم الأعمق قبل أن نكمل من القسم الأب.
const _similarMin = 4;
const _similarLimit = 12;

/// «قد يعجبكِ أيضاً»: الأكثر مبيعاً المتوفر من أعمق قسم للمنتج (الثالث ← الفرعي ←
/// الرئيسي)، ويُكمَل من القسم الأب حين يرجع أقل من 4 — لا قائمة واحدة عامة لكل منتجات
/// القسم الرئيسي. تبقى 5 دقائق (الرجوع للصفحة بلا انتظار)؛ الخطأ لا يبقى.
final similarProductsProvider =
    FutureProvider.autoDispose.family<List<Product>, SimilarProductsKey>((ref, args) {
  return keepAliveFor(ref, _shelfTtl, () async {
    final api = ref.read(apiServiceProvider);
    final levels = <({String? tertiary, String? sub, String? root})>[
      if (_present(args.tertiaryCategoryId)) (tertiary: args.tertiaryCategoryId, sub: null, root: null),
      if (_present(args.subcategoryId)) (tertiary: null, sub: args.subcategoryId, root: null),
      if (_present(args.categoryId)) (tertiary: null, sub: null, root: args.categoryId),
    ];
    final out = <Product>[];
    final seen = <String>{args.excludeId};
    Object? firstError;
    for (final level in levels) {
      try {
        final page = await api.getProducts(
          categoryId: level.root,
          subcategoryId: level.sub,
          tertiaryCategoryId: level.tertiary,
          sort: 'popular',
          inStock: true,
          limit: _similarLimit,
        );
        for (final p in page.items) {
          if (p.inStock && seen.add(p.id)) out.add(p);
        }
      } catch (e) {
        // مستوى واحد فشل: نجرّب الأب — ولا نُظهر خطأً إن رجع أي شيء.
        firstError ??= e;
      }
      if (out.length >= _similarMin) break;
    }
    if (out.isEmpty && firstError != null) throw firstError;
    return out.take(_similarLimit).toList(growable: false);
  });
});

bool _present(String? id) => id != null && id.trim().isNotEmpty;

/// قواعد نقاط الولاء الحالية (آخر إعدادات متجر معروفة — تبقى حتى بلا اتصال).
final loyaltyRulesProvider = Provider<LoyaltyRules>((ref) {
  return ref.watch(storeSettingsProvider.select((s) => s?.loyalty)) ?? const LoyaltyRules();
});

// ─── «أكملي للتوصيل المجاني» ────────────────────────────────────────────────

/// أكبر فرق نقترح له منتجات: فوقه لا يقنع الاقتراح (نفس حد المتجر على الويب).
const freeShippingFillersMaxBand = 40000;

/// المبلغ الناقص مقرّباً لأعلى لأقرب 1,000 د.ع — مفتاح [freeShippingFillersProvider]،
/// حتى لا يُعاد الطلب مع كل تغيير صغير في السلة.
int freeShippingBand(int remaining) => remaining <= 0 ? 0 : ((remaining + 999) ~/ 1000) * 1000;

/// اختصار: منتجات الفرق لمبلغ ناقص كما هو (يقرّبه إلى شريحته أولاً).
AutoDisposeFutureProvider<List<Product>> freeShippingFillersFor(int remaining) =>
    freeShippingFillersProvider(freeShippingBand(remaining));

/// منتجات محبوبة متوفرة بسعر قريب من الفرق — تُجلب مرة لكل شريحة وتبقى 5 دقائق.
final _freeShippingPoolProvider =
    FutureProvider.autoDispose.family<List<Product>, int>((ref, band) {
  return keepAliveFor(ref, _shelfTtl, () async {
    final minPrice = (band * 0.8).round();
    final maxPrice = (band * 1.6).round();
    // مفتاح كاش القوائم يميّز حدود السعر — كل شريحة بنسختها المحفوظة.
    final page = await ref.read(apiServiceProvider).getProducts(
          minPrice: minPrice,
          maxPrice: maxPrice,
          sort: 'popular',
          inStock: true,
          limit: 12,
        );
    // احتياط إن رجعت نسخة محفوظة لشريحة أخرى (بلا اتصال).
    return page.items
        .where((p) => p.price >= minPrice && p.price <= maxPrice)
        .toList(growable: false);
  });
});

/// «أكملي الفرق»: منتجات تغلق ما ينقص للتوصيل المجاني، بلا ما في السلة ولا النافد.
///
/// المفتاح هو الشريحة: مرّري `freeShippingBand(remaining)` أو استخدمي
/// [freeShippingFillersFor]. فارغة إن لم يكن هناك فرق أو كان أكبر من 40,000 د.ع.
final freeShippingFillersProvider =
    FutureProvider.autoDispose.family<List<Product>, int>((ref, key) {
  final band = freeShippingBand(key);
  if (band <= 0 || band > freeShippingFillersMaxBand) return Future.value(const <Product>[]);
  return keepAliveFor(ref, _shelfTtl, () async {
    // بصمة نصية: لا نعيد التصفية إلا حين تتغير منتجات السلة نفسها (لا الكميات).
    final inCart = ref
        .watch(cartProvider.select((c) => c.items.map((e) => e.productId).toSet().join('\n')))
        .split('\n')
        .toSet();
    final pool = await ref.watch(_freeShippingPoolProvider(band).future);
    return pool
        .where((p) => p.stock > 0 && !inCart.contains(p.id))
        .toList(growable: false);
  });
});
