import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../../data/models/banner_model.dart';
import '../../data/models/brand_model.dart';
import '../../data/models/category_model.dart';
import '../../data/models/product_model.dart';
import '../../data/models/product_package_model.dart';
import '../../data/remote/home_mappers.dart';
import '../../data/remote/product_remote_mapper.dart';
import '../../data/remote/store_api.dart';

class HomeFeedData {
  const HomeFeedData({
    required this.banners,
    required this.categories,
    required this.brands,
    required this.packages,
    required this.newArrivals,
    required this.bestSellers,
    required this.promoProducts,
    required this.settings,
    this.flashEndsAt,
  });

  final List<BannerModel> banners;
  final List<CategoryModel> categories;
  final List<BrandModel> brands;
  final List<ProductPackageModel> packages;
  final List<ProductModel> newArrivals;
  final List<ProductModel> bestSellers;
  final List<ProductModel> promoProducts;
  final Map<String, dynamic> settings;
  final String? flashEndsAt;
}

final homeFeedProvider = FutureProvider<HomeFeedData>((ref) async {
  final api = ref.read(storeApiProvider);
  final home = await api.home();
  final categoriesRaw = await api.categories();
  final settings = (home['settings'] as Map?)?.cast<String, dynamic>() ?? {};
  final flash = (home['flashSale'] as Map?)?.cast<String, dynamic>() ?? {};

  List<ProductModel> mapProducts(dynamic list) {
    if (list is! List) return [];
    return list
        .map((e) => ProductRemoteMapper.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  return HomeFeedData(
    banners: HomeMappers.banners(
      (home['banners'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ??
          [],
    ),
    categories: HomeMappers.categories(
      categoriesRaw
          .map((e) => Map<String, dynamic>.from(e))
          .toList(),
    ),
    brands: HomeMappers.brands(
      (home['brands'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? [],
    ),
    packages: HomeMappers.packages(
      (home['packages'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? [],
    ),
    newArrivals: mapProducts(home['newArrivals']),
    bestSellers: mapProducts(home['bestSellers']),
    promoProducts: mapProducts(flash['products']),
    settings: settings,
    flashEndsAt: flash['endsAt']?.toString(),
  );
});

final apiHealthProvider = FutureProvider<bool>((ref) async {
  return ref.read(storeApiProvider).health();
});

/// عنوان الـ API الحالي (للعرض في رسائل الخطأ).
final apiBaseUrlProvider = Provider<String>((ref) => AppConfig.apiBaseUrl);

final storeSettingsProvider = Provider<Map<String, dynamic>>((ref) {
  final home = ref.watch(homeFeedProvider);
  return home.maybeWhen(data: (d) => d.settings, orElse: () => {});
});

final whatsappLinkProvider = Provider<String>((ref) {
  final settings = ref.watch(storeSettingsProvider);
  final raw = settings['whatsapp']?.toString() ?? settings['supportPhone']?.toString() ?? '';
  final digits = raw.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return '';
  return 'https://wa.me/$digits';
});
