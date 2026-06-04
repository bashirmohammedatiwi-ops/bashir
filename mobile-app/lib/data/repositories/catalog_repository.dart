import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product_model.dart';
import '../remote/catalog_remote_data_source.dart';

class CatalogRepository {
  CatalogRepository(this._remote);
  final CatalogRemoteDataSource _remote;

  Future<List<ProductModel>> newArrivals() =>
      _remote.listProducts(isNew: true, limit: 20);

  Future<List<ProductModel>> bestSellers() =>
      _remote.listProducts(isBestSeller: true, limit: 20);

  Future<List<ProductModel>> recommended({int page = 1}) =>
      _remote.listProducts(page: page, limit: 20);

  Future<List<ProductModel>> byCategory(
    String categoryId, {
    int page = 1,
    int limit = 40,
  }) =>
      _remote.listProducts(categoryId: categoryId, page: page, limit: limit);

  Future<List<ProductModel>> byBrand(
    String brandId, {
    int page = 1,
    int limit = 40,
  }) =>
      _remote.listProducts(brandId: brandId, page: page, limit: limit);

  Future<List<ProductModel>> search(
    String query, {
    int page = 1,
    int limit = 40,
  }) =>
      _remote.listProducts(search: query, page: page, limit: limit);

  Future<ProductModel?> findProduct(String idOrSlug) async {
    try {
      return await _remote.findProduct(idOrSlug);
    } catch (_) {
      return null;
    }
  }

  Future<List<ProductModel>> listFiltered({
    int page = 1,
    int limit = 40,
    String? categoryId,
    String? subcategoryId,
    String? brandId,
    String? search,
    String? sort,
    int? minPrice,
    int? maxPrice,
    double? minRating,
    bool? inStock,
    String? skinType,
  }) =>
      _remote.listProducts(
        page: page,
        limit: limit,
        categoryId: categoryId,
        subcategoryId: subcategoryId,
        brandId: brandId,
        search: search,
        sort: sort,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minRating: minRating,
        inStock: inStock,
        skinType: skinType,
      );
}

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.read(catalogRemoteDataSourceProvider)),
);
