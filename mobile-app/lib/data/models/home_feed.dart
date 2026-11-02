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

/// إعداد الرفوف الشخصية لواجهة عالم من لوحة التحكم (world.homeShelves).
/// [hide] أسماء HomeSlotKind المخفية، [startAfter] بعد كم قسم يبدأ التخلّل،
/// [every] رفّ بعد كل كم قسم — القيم الغائبة = السلوك الافتراضي.
class HomeShelvesConfig {
  final Set<String> hide;
  final int? startAfter;
  final int? every;

  const HomeShelvesConfig({this.hide = const {}, this.startAfter, this.every});

  static HomeShelvesConfig? fromJson(dynamic raw) {
    if (raw is! Map) return null;
    int? n(Object? v, int min, int max) {
      final p = v == null ? null : num.tryParse(v.toString())?.round();
      return p?.clamp(min, max);
    }

    return HomeShelvesConfig(
      hide: asStringList(raw['hide']).toSet(),
      startAfter: n(raw['startAfter'], 0, 30),
      every: n(raw['every'], 1, 6),
    );
  }
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
  final List<Product> promoProducts;
  final StoreSettings settings;
  /// رفوف واجهة العالم — null خارج العوالم أو بلا إعداد.
  final HomeShelvesConfig? homeShelves;

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
    this.promoProducts = const [],
    this.settings = const StoreSettings(),
    this.homeShelves,
  });

  factory HomeFeed.fromJson(Map<String, dynamic> json) {
    final flash = asMap(json['flashSale']);
    return HomeFeed(
      sections: _parseSections(json['sections']),
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
      promoProducts: asList(json['promoProducts']).map(Product.fromJson).toList(),
      settings: StoreSettings.fromJson(asMap(json['settings'])),
      homeShelves: HomeShelvesConfig.fromJson(asMap(json['world'])['homeShelves']),
    );
  }

  static List<HomeSection> _parseSections(dynamic raw) {
    final out = <HomeSection>[];
    for (final item in asList(raw)) {
      try {
        out.add(HomeSection.fromJson(asMap(item)));
      } catch (_) {
        // تجاهل قسم تالف — لا نعطّل الصفحة
      }
    }
    return out;
  }
}
