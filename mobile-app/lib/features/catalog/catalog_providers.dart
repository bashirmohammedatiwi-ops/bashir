import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/loyalty_summary.dart';
import '../../data/models/product.dart';
import '../../data/models/review.dart';
import '../../data/services/api_service.dart';

final homeFeedProvider = FutureProvider.autoDispose<HomeFeed>((ref) {
  ref.keepAlive();
  return ref.read(apiServiceProvider).getHome();
});

final categoriesProvider = FutureProvider<List<Category>>((ref) async {
  ref.keepAlive();
  // أول تحميل بعد التحديث يجلب من الشبكة (مفتاح كاش جديد + TTL أقصر)
  return ref.read(apiServiceProvider).getCategories(forceRefresh: false);
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

final productDetailProvider =
    FutureProvider.family.autoDispose<Product, String>((ref, idOrSlug) {
  return ref.read(apiServiceProvider).getProduct(idOrSlug, forceRefresh: false);
});

final loyaltyProvider = FutureProvider.autoDispose<LoyaltySummary>((ref) {
  return ref.read(apiServiceProvider).getLoyalty();
});

final productReviewsProvider =
    FutureProvider.family.autoDispose<List<Review>, String>((ref, productId) async {
  return ref.read(apiServiceProvider).getProductReviews(productId);
});
