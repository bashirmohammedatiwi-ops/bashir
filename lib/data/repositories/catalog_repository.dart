import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/app_config.dart';
import '../mock/mock_products.dart';
import '../models/product_model.dart';
import '../remote/catalog_remote_data_source.dart';

/// Repository facade that hides whether data comes from mocks or from the
/// NestJS backend. Switch via `AppConfig.useRemoteApi`.
class CatalogRepository {
  CatalogRepository(this._remote);
  final CatalogRemoteDataSource _remote;

  Future<List<ProductModel>> newArrivals() async {
    if (!AppConfig.useRemoteApi) return MockProducts.newArrivals;
    return _remote.listProducts(isNew: true, limit: 20);
  }

  Future<List<ProductModel>> bestSellers() async {
    if (!AppConfig.useRemoteApi) return MockProducts.bestSellers;
    return _remote.listProducts(isBestSeller: true, limit: 20);
  }

  Future<List<ProductModel>> recommended({int page = 1}) async {
    if (!AppConfig.useRemoteApi) {
      final start = (page - 1) * 20;
      return MockProducts.all.skip(start).take(20).toList();
    }
    return _remote.listProducts(page: page, limit: 20);
  }

  Future<List<ProductModel>> byCategory(String categoryId, {int page = 1}) async {
    if (!AppConfig.useRemoteApi) {
      return MockProducts.byCategory(categoryId);
    }
    return _remote.listProducts(categoryId: categoryId, page: page);
  }

  Future<List<ProductModel>> byBrand(String brandId, {int page = 1}) async {
    if (!AppConfig.useRemoteApi) {
      return MockProducts.byBrand(brandId);
    }
    return _remote.listProducts(brandId: brandId, page: page);
  }

  Future<ProductModel?> findProduct(String idOrSlug) async {
    if (!AppConfig.useRemoteApi) {
      return MockProducts.findById(idOrSlug);
    }
    try {
      return await _remote.findProduct(idOrSlug);
    } catch (_) {
      return null;
    }
  }
}

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.read(catalogRemoteDataSourceProvider)),
);
