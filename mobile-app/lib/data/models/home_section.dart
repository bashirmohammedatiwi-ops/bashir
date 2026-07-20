import '../../core/utils/json.dart';
import 'banner.dart';
import 'brand.dart';
import 'category.dart';
import 'product.dart';

class PromoStrip {
  final String text;
  final List<String> items;
  final String? link;
  final String? linkType;
  final String? linkValue;
  final String? backgroundColor;
  final String? textColor;
  final bool marquee;
  final double marqueeSpeed;
  final String? icon;
  final String? variant;
  final String? label;
  final String? separator;
  final bool showIcon;

  const PromoStrip({
    required this.text,
    this.items = const [],
    this.link,
    this.linkType,
    this.linkValue,
    this.backgroundColor,
    this.textColor,
    this.marquee = true,
    this.marqueeSpeed = 5,
    this.icon,
    this.variant,
    this.label,
    this.separator,
    this.showIcon = true,
  });

  bool get hasLink =>
      (link != null && link!.isNotEmpty) ||
      (linkType != null && linkType!.isNotEmpty);

  bool get hasContent =>
      text.trim().isNotEmpty ||
      items.any((e) => e.trim().isNotEmpty);

  factory PromoStrip.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const PromoStrip(text: '');
    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems.map((e) => e.toString()).where((s) => s.trim().isNotEmpty).toList()
        : <String>[];
    return PromoStrip(
      text: asString(json['text']),
      items: items,
      link: json['link']?.toString(),
      linkType: json['linkType']?.toString(),
      linkValue: json['linkValue']?.toString(),
      backgroundColor: json['backgroundColor']?.toString(),
      textColor: json['textColor']?.toString(),
      marquee: json['marquee'] != false,
      marqueeSpeed: (json['marqueeSpeed'] as num?)?.toDouble() ?? 5,
      icon: json['icon']?.toString(),
      variant: json['variant']?.toString(),
      label: json['label']?.toString(),
      separator: json['separator']?.toString(),
      showIcon: json['showIcon'] != false,
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
  final String? adSlot;
  final double? bannerAspect;
  final bool fullBleed;
  final double? marqueeSpeed;
  final double? marqueeGap;
  final double? imageHeight;
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
    this.adSlot,
    this.bannerAspect,
    this.fullBleed = false,
    this.marqueeSpeed,
    this.marqueeGap,
    this.imageHeight,
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
        adSlot: json['adSlot']?.toString(),
        bannerAspect: json['bannerAspect'] != null
            ? (json['bannerAspect'] as num).toDouble()
            : null,
        fullBleed: json['fullBleed'] == true,
        marqueeSpeed: json['marqueeSpeed'] != null
            ? (json['marqueeSpeed'] as num).toDouble()
            : null,
        marqueeGap:
            json['marqueeGap'] != null ? (json['marqueeGap'] as num).toDouble() : null,
        imageHeight: json['imageHeight'] != null
            ? (json['imageHeight'] as num).toDouble()
            : null,
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
