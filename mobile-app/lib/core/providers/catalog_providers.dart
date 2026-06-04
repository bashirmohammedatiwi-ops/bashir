import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/brand_model.dart';
import '../../data/models/category_model.dart';
import '../../data/models/notification_model.dart';
import '../../data/models/order_model.dart';
import '../../data/models/product_model.dart';
import '../../data/models/product_package_model.dart';
import '../../data/models/review_model.dart';
import '../../data/remote/home_mappers.dart';
import '../../data/remote/notification_remote_mapper.dart';
import '../../data/remote/order_remote_mapper.dart';
import '../../data/remote/product_remote_mapper.dart';
import '../../data/remote/review_remote_mapper.dart';
import '../../data/remote/store_api.dart';
import '../../data/repositories/catalog_repository.dart';

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final raw = await ref.read(storeApiProvider).categories();
  return HomeMappers.categories(raw);
});

final brandsProvider = FutureProvider<List<BrandModel>>((ref) async {
  final raw = await ref.read(storeApiProvider).brands();
  return HomeMappers.brands(raw);
});

final productProvider =
    FutureProvider.family<ProductModel?, String>((ref, id) async {
  return ref.read(catalogRepositoryProvider).findProduct(id);
});

class ProductDetailData {
  const ProductDetailData({required this.product, required this.reviews});
  final ProductModel product;
  final List<ReviewModel> reviews;
}

final productDetailProvider =
    FutureProvider.family<ProductDetailData?, String>((ref, id) async {
  try {
    final raw = await ref.read(storeApiProvider).product(id);
    final product = ProductRemoteMapper.fromJson(raw);
    final reviewsRaw = (raw['reviews'] as List?) ?? [];
    final reviews = reviewsRaw
        .map((e) => ReviewRemoteMapper.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return ProductDetailData(product: product, reviews: reviews);
  } catch (_) {
    return null;
  }
});

final relatedProductsProvider = FutureProvider.family<
    List<ProductModel>,
    ({String categoryId, String excludeId})>((ref, key) async {
  final list = await ref
      .read(catalogRepositoryProvider)
      .byCategory(key.categoryId, limit: 12);
  return list.where((p) => p.id != key.excludeId).take(6).toList();
});

final packageDetailProvider =
    FutureProvider.family<PackageDetailData?, String>((ref, id) async {
  try {
    final raw = await ref.read(storeApiProvider).packageById(id);
    final packages = HomeMappers.packages([raw]);
    if (packages.isEmpty) return null;
    final pkg = packages.first;
    final items = (raw['items'] as List?) ?? [];
    final products = <ProductModel>[];
    for (final item in items) {
      final m = Map<String, dynamic>.from(item as Map);
      final pJson = m['product'] as Map<String, dynamic>?;
      if (pJson != null) {
        products.add(ProductRemoteMapper.fromJson(pJson));
      }
    }
    return PackageDetailData(package: pkg, products: products);
  } catch (_) {
    return null;
  }
});

class PackageDetailData {
  const PackageDetailData({required this.package, required this.products});
  final ProductPackageModel package;
  final List<ProductModel> products;
}

final orderDetailProvider =
    FutureProvider.family<OrderModel?, String>((ref, id) async {
  try {
    final raw = await ref.read(storeApiProvider).order(id);
    return OrderRemoteMapper.fromJson(raw);
  } catch (_) {
    return null;
  }
});

final notificationsProvider =
    FutureProvider<List<NotificationModel>>((ref) async {
  final raw = await ref.read(storeApiProvider).notifications();
  return raw.map(NotificationRemoteMapper.fromJson).toList();
});

final productReviewsProvider =
    FutureProvider.family<List<ReviewModel>, String>((ref, productId) async {
  final raw = await ref.read(storeApiProvider).productReviews(productId);
  return raw.map(ReviewRemoteMapper.fromJson).toList();
});
