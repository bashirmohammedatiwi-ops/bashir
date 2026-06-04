import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../data/models/product_model.dart';
import '../../../data/repositories/catalog_repository.dart';

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

String _sortParam(SortOption sort) => switch (sort) {
      SortOption.newest => 'newest',
      SortOption.bestSelling => 'popular',
      SortOption.priceAsc => 'price_asc',
      SortOption.priceDesc => 'price_desc',
      SortOption.rating => 'rating',
    };

final filteredProductsProvider = FutureProvider<List<ProductModel>>((ref) async {
  final filter = ref.watch(filterProvider);
  final repo = ref.read(catalogRepositoryProvider);

  final brandId = filter.brandId ??
      (filter.selectedBrands.length == 1 ? filter.selectedBrands.first : null);

  var products = await repo.listFiltered(
    page: 1,
    limit: 60,
    categoryId: filter.categoryId,
    subcategoryId: filter.subcategoryId,
    brandId: brandId,
    search: filter.searchQuery,
    sort: _sortParam(filter.sort),
    minPrice: filter.minPrice > 0 ? filter.minPrice : null,
    maxPrice: filter.maxPrice < 500000 ? filter.maxPrice : null,
    minRating: filter.minRating > 0 ? filter.minRating : null,
    inStock: filter.inStockOnly ? true : null,
    skinType: filter.skinType,
  );

  if (filter.selectedBrands.length > 1) {
    products = products
        .where((p) => filter.selectedBrands.contains(p.brandId))
        .toList();
  }

  return products;
});
