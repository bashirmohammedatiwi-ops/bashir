import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/loyalty_summary.dart';
import '../../data/models/product.dart';
import '../../data/models/review.dart';
import '../../data/services/api_service.dart';
import '../auth/auth_provider.dart';

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

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  ref.keepAlive();
  // أول تحميل بعد التحديث يجلب من الشبكة (مفتاح كاش جديد + TTL أقصر)
  return ref.read(apiServiceProvider).getCategories(forceRefresh: true);
});

/// إعادة تحميل الأقسام من السيرفر مباشرة (يسحب للتحديث / إعادة المحاولة).
Future<List<Category>> refreshCategories(WidgetRef ref) async {
  await ref.read(apiCacheProvider).remove('categories_all_v2');
  await ref.read(apiCacheProvider).remove('categories_all_v1');
  ref.invalidate(categoriesProvider);
  return ref.read(apiServiceProvider).getCategories(forceRefresh: true);
}

final brandsProvider = FutureProvider<List<Brand>>((ref) {
  ref.keepAlive();
  return ref.read(apiServiceProvider).getBrands(all: true);
});

/// براندات مرتبطة بقسم رئيسي.
final categoryBrandsProvider = FutureProvider.family<List<Brand>, String>((ref, categoryId) {
  return ref.read(apiServiceProvider).getBrands(categoryId: categoryId);
});

/// براندات مرتبطة بقسم فرعي.
final subcategoryBrandsProvider = FutureProvider.family<List<Brand>, String>((ref, subcategoryId) {
  return ref.read(apiServiceProvider).getBrands(subcategoryId: subcategoryId);
});

final productDetailProvider =
    FutureProvider.family.autoDispose<Product, String>((ref, idOrSlug) async {
  final api = ref.read(apiServiceProvider);
  final product = await api.getProduct(idOrSlug, forceRefresh: false);
  // وصل من الشبكة للتو: لا طلب ثانٍ. أما إن جاء من الكاش فنتحقق بهدوء من صور أحدث.
  if (api.isProductFresh(idOrSlug)) return product;

  final imageStamp = '${product.coverUrl}|${product.galleryUrls.join(',')}';
  unawaited(() async {
    try {
      final fresh = await api.getProduct(idOrSlug, forceRefresh: true);
      final freshStamp = '${fresh.coverUrl}|${fresh.galleryUrls.join(',')}';
      if (freshStamp != imageStamp) ref.invalidateSelf();
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

/// «اطلبيها مرة ثانية»: فارغة للزائرة؛ للمسجّلة من طلباتها (تتجدد مع تسجيل الدخول).
final buyAgainProvider = FutureProvider.autoDispose<List<Product>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuthenticated) return const [];
  try {
    return await ref.read(apiServiceProvider).getBuyAgain();
  } catch (_) {
    return const [];
  }
});

/// منتجات مشابهة من نفس القسم (يستثني المنتج الحالي).
final boughtTogetherProvider = FutureProvider.autoDispose
    .family<({List<Product> items, bool fromOrders}), String>((ref, productId) {
  return ref.read(apiServiceProvider).getBoughtTogether(productId);
});

final similarProductsProvider = FutureProvider.autoDispose
    .family<List<Product>, ({String categoryId, String excludeId})>((ref, args) async {
  final page = await ref
      .read(apiServiceProvider)
      .getProducts(categoryId: args.categoryId, limit: 10, sort: 'brand');
  return page.items.where((p) => p.id != args.excludeId).take(8).toList();
});
