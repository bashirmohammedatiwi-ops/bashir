import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/product_model.dart';
import '../../../data/models/product_package_model.dart';
import '../../../data/models/review_model.dart';
import '../../../data/remote/app_remote_data_source.dart';
import 'filter_provider.dart';

String? _sortParam(SortOption sort) => switch (sort) {
      SortOption.newest => 'newest',
      SortOption.bestSelling => 'best_selling',
      SortOption.priceAsc => 'price_asc',
      SortOption.priceDesc => 'price_desc',
      SortOption.rating => 'rating',
    };

final filteredProductsProvider = FutureProvider<List<ProductModel>>((ref) async {
  final filter = ref.watch(filterProvider);
  final remote = ref.read(appRemoteDataSourceProvider);
  var products = await remote.listProducts(
    categoryId: filter.categoryId,
    subcategoryId: filter.subcategoryId,
    brandId: filter.brandId ?? (filter.selectedBrands.length == 1 ? filter.selectedBrands.first : null),
    search: filter.searchQuery,
    sort: _sortParam(filter.sort),
    limit: 100,
  );

  if (filter.selectedBrands.length > 1) {
    products = products.where((p) => filter.selectedBrands.contains(p.brandId)).toList();
  }
  products = products
      .where((p) => p.price >= filter.minPrice && p.price <= filter.maxPrice)
      .toList();
  if (filter.minRating > 0) {
    products = products.where((p) => p.rating >= filter.minRating).toList();
  }
  if (filter.inStockOnly) {
    products = products.where((p) => p.inStock).toList();
  }
  if (filter.skinType != null) {
    products = products.where((p) => p.skinType.contains(filter.skinType!)).toList();
  }
  return products;
});

final productDetailProvider =
    FutureProvider.family<ProductModel?, String>((ref, id) async {
  try {
    return await ref.read(appRemoteDataSourceProvider).findProduct(id);
  } catch (_) {
    return null;
  }
});

final productReviewsProvider =
    FutureProvider.family<List<ReviewModel>, String>((ref, productId) async {
  return ref.read(appRemoteDataSourceProvider).productReviews(productId);
});

final packageDetailProvider =
    FutureProvider.family<ProductPackageModel?, String>((ref, id) async {
  try {
    return await ref.read(appRemoteDataSourceProvider).findPackage(id);
  } catch (_) {
    return null;
  }
});

final packageProductsProvider =
    FutureProvider.family<List<ProductModel>, List<String>>((ref, ids) async {
  final remote = ref.read(appRemoteDataSourceProvider);
  final products = <ProductModel>[];
  for (final id in ids) {
    try {
      products.add(await remote.findProduct(id));
    } catch (_) {}
  }
  return products;
});

final relatedProductsProvider =
    FutureProvider.family<List<ProductModel>, String>((ref, productId) async {
  final product = await ref.read(productDetailProvider(productId).future);
  if (product == null) return [];
  final products = await ref.read(appRemoteDataSourceProvider).listProducts(
        categoryId: product.categoryId,
        limit: 10,
      );
  return products.where((p) => p.id != productId).take(6).toList();
});
