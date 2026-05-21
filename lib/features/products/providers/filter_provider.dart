import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/mock/mock_products.dart';
import '../../../data/models/product_model.dart';

enum SortOption { newest, bestSelling, priceAsc, priceDesc, rating }

class FilterState {
  const FilterState({
    this.sort = SortOption.newest,
    this.minPrice = 0,
    this.maxPrice = 500000,
    this.selectedBrands = const [],
    this.minRating = 0,
    this.inStockOnly = false,
    this.skinType,
    this.categoryId,
    this.subcategoryId,
    this.brandId,
    this.searchQuery,
  });

  final SortOption sort;
  final int minPrice;
  final int maxPrice;
  final List<String> selectedBrands;
  final double minRating;
  final bool inStockOnly;
  final String? skinType;
  final String? categoryId;
  final String? subcategoryId;
  final String? brandId;
  final String? searchQuery;

  FilterState copyWith({
    SortOption? sort,
    int? minPrice,
    int? maxPrice,
    List<String>? selectedBrands,
    double? minRating,
    bool? inStockOnly,
    String? skinType,
    String? categoryId,
    String? subcategoryId,
    String? brandId,
    String? searchQuery,
  }) =>
      FilterState(
        sort: sort ?? this.sort,
        minPrice: minPrice ?? this.minPrice,
        maxPrice: maxPrice ?? this.maxPrice,
        selectedBrands: selectedBrands ?? this.selectedBrands,
        minRating: minRating ?? this.minRating,
        inStockOnly: inStockOnly ?? this.inStockOnly,
        skinType: skinType ?? this.skinType,
        categoryId: categoryId ?? this.categoryId,
        subcategoryId: subcategoryId ?? this.subcategoryId,
        brandId: brandId ?? this.brandId,
        searchQuery: searchQuery ?? this.searchQuery,
      );
}

class FilterNotifier extends StateNotifier<FilterState> {
  FilterNotifier([FilterState? initial])
      : super(initial ?? const FilterState());

  void reset() => state = const FilterState();

  void update(FilterState newState) => state = newState;
}

final filterProvider =
    StateNotifierProvider<FilterNotifier, FilterState>((ref) {
  return FilterNotifier();
});

final filteredProductsProvider = Provider<List<ProductModel>>((ref) {
  final filter = ref.watch(filterProvider);
  var products = List<ProductModel>.from(MockProducts.all);

  if (filter.categoryId != null) {
    products = products.where((p) => p.categoryId == filter.categoryId).toList();
  }
  if (filter.subcategoryId != null) {
    products =
        products.where((p) => p.subcategoryId == filter.subcategoryId).toList();
  }
  if (filter.brandId != null) {
    products = products.where((p) => p.brandId == filter.brandId).toList();
  }
  if (filter.searchQuery != null && filter.searchQuery!.isNotEmpty) {
    products = MockProducts.search(filter.searchQuery!);
  }
  if (filter.selectedBrands.isNotEmpty) {
    products =
        products.where((p) => filter.selectedBrands.contains(p.brandId)).toList();
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
    products =
        products.where((p) => p.skinType.contains(filter.skinType!)).toList();
  }

  switch (filter.sort) {
    case SortOption.newest:
      products.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    case SortOption.bestSelling:
      products.sort((a, b) => b.soldCount.compareTo(a.soldCount));
    case SortOption.priceAsc:
      products.sort((a, b) => a.price.compareTo(b.price));
    case SortOption.priceDesc:
      products.sort((a, b) => b.price.compareTo(a.price));
    case SortOption.rating:
      products.sort((a, b) => b.rating.compareTo(a.rating));
  }
  return products;
});
