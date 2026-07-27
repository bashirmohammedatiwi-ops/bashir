import '../../core/utils/json.dart';
import '../../core/l10n/localized_text.dart' as l10n;
import '../../core/utils/media_url.dart';
import 'banner.dart';
import 'brand.dart';
import 'category.dart';
import 'product.dart';

class PromoStrip {
  final String text;
  final String? textEn;
  final List<String> items;
  final List<String> itemsEn;
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
  final String? labelEn;
  final String? separator;
  final bool showIcon;

  const PromoStrip({
    required this.text,
    this.textEn,
    this.items = const [],
    this.itemsEn = const [],
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
    this.labelEn,
    this.separator,
    this.showIcon = true,
  });

  bool get hasLink =>
      (link != null && link!.isNotEmpty) ||
      (linkType != null && linkType!.isNotEmpty);

  bool get hasContent =>
      text.trim().isNotEmpty ||
      (textEn?.trim().isNotEmpty ?? false) ||
      items.any((e) => e.trim().isNotEmpty) ||
      itemsEn.any((e) => e.trim().isNotEmpty);

  String textForLang(String lang) => l10n.localizedText(
        languageCode: lang,
        ar: text,
        en: textEn,
        fallback: '',
      );

  String labelForLang(String lang) => l10n.localizedText(
        languageCode: lang,
        ar: label,
        en: labelEn,
        fallback: lang == 'en' ? 'Breaking' : 'عاجل',
      );

  List<String> linesForLang(String lang) {
    final enItems = itemsEn.where((e) => e.trim().isNotEmpty).toList();
    final arItems = items.where((e) => e.trim().isNotEmpty).toList();
    if (lang == 'en' && enItems.isNotEmpty) return enItems;
    if (arItems.isNotEmpty) return arItems;
    if (enItems.isNotEmpty) return enItems;
    return const [];
  }

  factory PromoStrip.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const PromoStrip(text: '');
    final rawItems = json['items'];
    final items = rawItems is List
        ? rawItems.map((e) => e.toString()).where((s) => s.trim().isNotEmpty).toList()
        : <String>[];
    final rawItemsEn = json['itemsEn'];
    final itemsEn = rawItemsEn is List
        ? rawItemsEn.map((e) => e.toString()).where((s) => s.trim().isNotEmpty).toList()
        : <String>[];
    return PromoStrip(
      text: asString(json['text']),
      textEn: json['textEn']?.toString(),
      items: items,
      itemsEn: itemsEn,
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
      labelEn: json['labelEn']?.toString(),
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
      coverUrl: url.isNotEmpty ? resolveMediaUrl(url) : null,
      link: json['link']?.toString(),
      cardSize: json['cardSize']?.toString(),
    );
  }
}

class HomeSection {
  final String id;
  final String type;
  final String? title;
  final String? titleEn;
  final String? subtitle;
  final String? subtitleEn;
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
  final String? headerImageUrl;
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
  final String? aspectRatio;
  final String? overlayStyle;
  final String? borderStyle;
  final bool showShadow;
  final double? customWidth;
  final double? customHeight;
  final double? tilesPerView;
  final String? rowHeight;
  final double? tileCornerRadius;
  final List<HomeSection> children;
  final double? borderRadius;
  final String? borderColor;
  final double? framePaddingH;
  final String? titleColor;
  final bool frameShadow;

  const HomeSection({
    required this.id,
    required this.type,
    this.title,
    this.titleEn,
    this.subtitle,
    this.subtitleEn,
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
    this.headerImageUrl,
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
    this.aspectRatio,
    this.overlayStyle,
    this.borderStyle,
    this.showShadow = false,
    this.customWidth,
    this.customHeight,
    this.tilesPerView,
    this.rowHeight,
    this.tileCornerRadius,
    this.children = const [],
    this.borderRadius,
    this.borderColor,
    this.framePaddingH,
    this.titleColor,
    this.frameShadow = false,
  });

  String? titleForLang(String lang) {
    final val = l10n.localizedText(
      languageCode: lang,
      ar: title,
      en: titleEn,
      fallback: '',
    );
    return val.trim().isEmpty ? null : val;
  }

  String? subtitleForLang(String lang) {
    final val = l10n.localizedText(
      languageCode: lang,
      ar: subtitle,
      en: subtitleEn,
      fallback: '',
    );
    return val.trim().isEmpty ? null : val;
  }

  factory HomeSection.fromJson(Map<String, dynamic> json) => HomeSection(
        id: asString(json['id']),
        type: asString(json['type']),
        title: json['title']?.toString(),
        titleEn: json['titleEn']?.toString(),
        subtitle: json['subtitle']?.toString(),
        subtitleEn: json['subtitleEn']?.toString(),
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
        headerImageUrl: json['headerImageUrl']?.toString(),
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
        aspectRatio: json['aspectRatio']?.toString(),
        overlayStyle: json['overlayStyle']?.toString(),
        borderStyle: json['borderStyle']?.toString(),
        showShadow: json['showShadow'] == true,
        customWidth: json['customWidth'] != null ? (json['customWidth'] as num).toDouble() : null,
        customHeight: json['customHeight'] != null ? (json['customHeight'] as num).toDouble() : null,
        tilesPerView: json['tilesPerView'] != null ? (json['tilesPerView'] as num).toDouble() : null,
        rowHeight: json['rowHeight']?.toString(),
        tileCornerRadius: json['tileCornerRadius'] != null
            ? (json['tileCornerRadius'] as num).toDouble()
            : null,
        children: asList(json['children']).map((e) => HomeSection.fromJson(asMap(e))).toList(),
        borderRadius: json['borderRadius'] != null ? (json['borderRadius'] as num).toDouble() : null,
        borderColor: json['borderColor']?.toString(),
        framePaddingH: json['framePaddingH'] != null ? (json['framePaddingH'] as num).toDouble() : null,
        titleColor: json['titleColor']?.toString(),
        frameShadow: json['frameShadow'] == true,
      );
}

String cmsTextForLang(
  Map<String, dynamic> raw,
  String lang, {
  String arKey = 'title',
  String enKey = 'titleEn',
}) =>
    l10n.localizedText(
      languageCode: lang,
      ar: raw[arKey]?.toString(),
      en: raw[enKey]?.toString(),
      fallback: '',
    );
