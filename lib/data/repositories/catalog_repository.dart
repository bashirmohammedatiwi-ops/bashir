import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/product_model.dart';
import '../remote/app_remote_data_source.dart';

class CatalogRepository {
  CatalogRepository(this._remote);
  final AppRemoteDataSource _remote;

  Future<List<ProductModel>> newArrivals() =>
      _remote.listProducts(isNew: true, limit: 20);

  Future<List<ProductModel>> bestSellers() =>
      _remote.listProducts(isBestSeller: true, limit: 20);

  Future<List<ProductModel>> recommended({int page = 1}) =>
      _remote.listProducts(page: page, limit: 20);

  Future<List<ProductModel>> byCategory(String categoryId, {int page = 1}) =>
      _remote.listProducts(categoryId: categoryId, page: page);

  Future<List<ProductModel>> byBrand(String brandId, {int page = 1}) =>
      _remote.listProducts(brandId: brandId, page: page);

  Future<ProductModel?> findProduct(String idOrSlug) async {
    try {
      return await _remote.findProduct(idOrSlug);
    } catch (_) {
      return null;
    }
  }
}

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.read(appRemoteDataSourceProvider)),
);
