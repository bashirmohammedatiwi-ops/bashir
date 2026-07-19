import '../../core/utils/json.dart';
import 'banner.dart';
import 'brand.dart';
import 'category.dart';
import 'product.dart';

class PromoStrip {
  final String text;
  final String? link;
  final String? linkType;
  final String? linkValue;
  final String? backgroundColor;
  final bool marquee;
  final String? icon;
  const PromoStrip({
    required this.text,
    this.link,
    this.linkType,
    this.linkValue,
    this.backgroundColor,
    this.marquee = true,
    this.icon,
  });

  bool get hasLink =>
      (link != null && link!.isNotEmpty) ||
      (linkType != null && linkType!.isNotEmpty);

  factory PromoStrip.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const PromoStrip(text: '');
    return PromoStrip(
      text: asString(json['text']),
      link: json['link']?.toString(),
      linkType: json['linkType']?.toString(),
      linkValue: json['linkValue']?.toString(),
      backgroundColor: json['backgroundColor']?.toString(),
      marquee: json['marquee'] != false,
      icon: json['icon']?.toString(),
    );
  }
}

class HomePackage {
  final String id;
  final String name;
  final String slug;
  final int price;
  final int? originalPrice;
  final String? coverUrl;
  final String? link;
  final String? cardSize;
  const HomePackage({
    required this.id,
    required this.name,
    required this.slug,
    required this.price,
    this.originalPrice,
    this.coverUrl,
    this.link,
    this.cardSize,
  });

  factory HomePackage.fromJson(Map<String, dynamic> json) {
    final cover = json['coverImage'];
    String url = '';
    if (cover is Map) {
      final m = asMap(cover);
      url = m['url']?.toString() ?? m['full']?.toString() ?? m['thumb']?.toString() ?? '';
      if (url.isEmpty && m['variants'] is Map) {
        final variants = asMap(m['variants']);
        for (final size in ['medium', 'thumb', 'small']) {
          final formats = asMap(asMap(variants[size])['formats']);
          final rel = formats['webp'] ?? formats['jpg'];
          if (rel != null) {
            url = rel.toString();
            break;
          }
        }
      }
    }
    return HomePackage(
      id: asString(json['id']),
      name: asString(json['name']),
      slug: asString(json['slug']),
      price: asInt(json['price']),
      originalPrice: json['originalPrice'] != null ? asInt(json['originalPrice']) : null,
      coverUrl: url.isNotEmpty ? url : null,
      link: json['link']?.toString(),
      cardSize: json['cardSize']?.toString(),
    );
  }
}

class HomeSection {
  final String id;
  final String type;
  final String? title;
  final String? subtitle;
  final int position;
  final String? layout;
  final String? sectionLayout;
  final String? cardSize;
  final bool showTitle;
  final double? paddingTop;
  final double? paddingBottom;
  final String? productCardSize;
  final String? backgroundColor;
  final bool showViewAll;
  final String? viewAllQuery;
  final DateTime? endsAt;
  final List<AppBanner> banners;
  final List<Category> categories;
  final List<Product> products;
  final List<Brand> brands;
  final List<HomePackage> packages;
  final List<dynamic> items;
  final List<Category> skinConcerns;
  final PromoStrip? promoStrip;
  final String? display;
  final String? shape;
  final String? kind;

  const HomeSection({
    required this.id,
    required this.type,
    this.title,
    this.subtitle,
    this.position = 0,
    this.layout,
    this.sectionLayout,
    this.cardSize,
    this.showTitle = false,
    this.paddingTop,
    this.paddingBottom,
    this.productCardSize,
    this.backgroundColor,
    this.showViewAll = true,
    this.viewAllQuery,
    this.endsAt,
    this.banners = const [],
    this.categories = const [],
    this.products = const [],
    this.brands = const [],
    this.packages = const [],
    this.items = const [],
    this.skinConcerns = const [],
    this.promoStrip,
    this.display,
    this.shape,
    this.kind,
  });

  factory HomeSection.fromJson(Map<String, dynamic> json) => HomeSection(
        id: asString(json['id']),
        type: asString(json['type']),
        title: json['title']?.toString(),
        subtitle: json['subtitle']?.toString(),
        position: asInt(json['position']),
        layout: json['layout']?.toString(),
        sectionLayout: json['sectionLayout']?.toString(),
        cardSize: json['cardSize']?.toString(),
        showTitle: json['showTitle'] == true,
        paddingTop: json['paddingTop'] != null ? (json['paddingTop'] as num).toDouble() : null,
        paddingBottom: json['paddingBottom'] != null ? (json['paddingBottom'] as num).toDouble() : null,
        productCardSize: json['productCardSize']?.toString(),
        backgroundColor: json['backgroundColor']?.toString(),
        showViewAll: json['showViewAll'] != false,
        viewAllQuery: json['viewAllQuery']?.toString(),
        endsAt: DateTime.tryParse(asString(json['endsAt'])),
        banners: asList(json['banners']).map((e) => AppBanner.fromJson(asMap(e))).toList(),
        categories: asList(json['categories']).map((e) => Category.fromJson(asMap(e))).toList(),
        products: asList(json['products']).map((e) => Product.fromJson(asMap(e))).toList(),
        brands: asList(json['brands']).map((e) => Brand.fromJson(asMap(e))).toList(),
        packages: asList(json['packages']).map((e) => HomePackage.fromJson(asMap(e))).toList(),
        items: asList(json['items']),
        skinConcerns: asList(json['skinConcerns']).map((e) => Category.fromJson(asMap(e))).toList(),
        promoStrip: json['promoStrip'] != null
            ? PromoStrip.fromJson(asMap(json['promoStrip']))
            : null,
        display: json['display']?.toString(),
        shape: json['shape']?.toString(),
        kind: json['kind']?.toString(),
      );
}
