import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/brand.dart';
import '../../data/models/category.dart';
import '../../data/models/home_feed.dart';
import '../../data/models/product.dart';
import '../../data/models/review.dart';
import '../../data/services/api_service.dart';

final homeFeedProvider = FutureProvider.autoDispose<HomeFeed>((ref) {
  ref.keepAlive();
  return ref.read(apiServiceProvider).getHome();
});

final categoriesProvider = FutureProvider<List<Category>>((ref) {
  return ref.read(apiServiceProvider).getCategories();
});

final brandsProvider = FutureProvider<List<Brand>>((ref) {
  return ref.read(apiServiceProvider).getBrands(all: true);
});

final productDetailProvider =
    FutureProvider.family.autoDispose<Product, String>((ref, idOrSlug) {
  return ref.read(apiServiceProvider).getProduct(idOrSlug);
});

final productReviewsProvider =
    FutureProvider.family.autoDispose<List<Review>, String>((ref, productId) async {
  return ref.read(apiServiceProvider).getProductReviews(productId);
});
