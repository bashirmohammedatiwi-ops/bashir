import '../../core/utils/json.dart';
import 'banner.dart';
import 'brand.dart';
import 'category.dart';
import 'home_section.dart';
import 'product.dart';
import 'store_settings.dart';

class FlashSale {
  final DateTime? endsAt;
  final List<Product> products;
  const FlashSale({this.endsAt, this.products = const []});
}

class HomeFeed {
  final List<HomeSection> sections;
  final List<AppBanner> banners;
  final List<Category> categories;
  final List<Brand> brands;
  final List<Category> skinConcerns;
  final FlashSale flashSale;
  final List<Product> newArrivals;
  final List<Product> bestSellers;
  final List<Product> featured;
  final StoreSettings settings;

  const HomeFeed({
    this.sections = const [],
    this.banners = const [],
    this.categories = const [],
    this.brands = const [],
    this.skinConcerns = const [],
    this.flashSale = const FlashSale(),
    this.newArrivals = const [],
    this.bestSellers = const [],
    this.featured = const [],
    this.settings = const StoreSettings(),
  });

  factory HomeFeed.fromJson(Map<String, dynamic> json) {
    final flash = asMap(json['flashSale']);
    return HomeFeed(
      sections: asList(json['sections']).map((e) => HomeSection.fromJson(asMap(e))).toList(),
      banners: asList(json['banners']).map(AppBanner.fromJson).toList(),
      categories: asList(json['categories']).map(Category.fromJson).toList(),
      brands: asList(json['brands']).map(Brand.fromJson).toList(),
      skinConcerns: asList(json['skinConcerns']).map(Category.fromJson).toList(),
      flashSale: FlashSale(
        endsAt: DateTime.tryParse(asString(flash['endsAt'])),
        products: asList(flash['products']).map(Product.fromJson).toList(),
      ),
      newArrivals: asList(json['newArrivals']).map(Product.fromJson).toList(),
      bestSellers: asList(json['bestSellers']).map(Product.fromJson).toList(),
      featured: asList(json['featuredProducts']).map(Product.fromJson).toList(),
      settings: StoreSettings.fromJson(asMap(json['settings'])),
    );
  }
}
