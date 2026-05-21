import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/media_url.dart';
import '../../../data/models/banner_model.dart';
import '../../../data/models/brand_model.dart';
import '../../../data/models/category_model.dart';
import '../../../data/models/product_model.dart';
import '../../../data/models/product_package_model.dart';
import '../../../data/remote/app_remote_data_source.dart';
import '../../../data/remote/product_remote_mapper.dart';
import '../../../data/remote/remote_mappers.dart';

class HomeFeed {
  const HomeFeed({
    required this.banners,
    required this.categories,
    required this.brands,
    required this.packages,
    required this.newArrivals,
    required this.bestSellers,
    required this.promoProducts,
    required this.recommended,
    this.flashEndsAt,
    this.storeName,
    this.whatsapp,
  });

  final List<BannerModel> banners;
  final List<CategoryModel> categories;
  final List<BrandModel> brands;
  final List<ProductPackageModel> packages;
  final List<ProductModel> newArrivals;
  final List<ProductModel> bestSellers;
  final List<ProductModel> promoProducts;
  final List<ProductModel> recommended;
  final DateTime? flashEndsAt;
  final String? storeName;
  final String? whatsapp;
}

List<ProductModel> _mapProducts(dynamic list) => (list as List? ?? const [])
    .cast<Map<String, dynamic>>()
    .map(ProductRemoteMapper.fromJson)
    .toList();

final homeFeedProvider = FutureProvider<HomeFeed>((ref) async {
  final remote = ref.read(appRemoteDataSourceProvider);
  final raw = await remote.homeFeed();

  final banners = (raw['banners'] as List? ?? const [])
      .cast<Map<String, dynamic>>()
      .map((b) => BannerModel(
            id: b['id'] as String,
            title: (b['title'] as String?) ?? '',
            subtitle: (b['subtitle'] as String?) ?? '',
            imageUrl: resolveMediaUrl(b['image']),
            actionRoute: b['linkUrl'] as String?,
          ))
      .toList();

  return HomeFeed(
    banners: banners,
    categories: (raw['categories'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.category)
        .toList(),
    brands: (raw['brands'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.brand)
        .toList(),
    packages: (raw['packages'] as List? ?? const [])
        .cast<Map<String, dynamic>>()
        .map(RemoteMappers.package)
        .toList(),
    newArrivals: _mapProducts(raw['newArrivals']),
    bestSellers: _mapProducts(raw['bestSellers']),
    promoProducts: _mapProducts(raw['flashSale']?['products']),
    recommended: _mapProducts(raw['featuredProducts']),
    flashEndsAt: raw['flashSale']?['endsAt'] != null
        ? DateTime.tryParse(raw['flashSale']['endsAt'].toString())
        : null,
    storeName: raw['settings']?['storeName'] as String?,
    whatsapp: raw['settings']?['whatsapp'] as String?,
  );
});

final settingsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.read(appRemoteDataSourceProvider).settings();
});

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  return ref.read(appRemoteDataSourceProvider).listCategories();
});

final brandsProvider = FutureProvider<List<BrandModel>>((ref) async {
  return ref.read(appRemoteDataSourceProvider).listBrands();
});

final packagesProvider = FutureProvider<List<ProductPackageModel>>((ref) async {
  return ref.read(appRemoteDataSourceProvider).listPackages();
});
