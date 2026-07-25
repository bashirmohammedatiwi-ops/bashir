import '../../core/l10n/localized_text.dart';
import '../../core/utils/json.dart';
import 'media.dart';

class Brand {
  final String id;
  final String name;
  final String? nameAr;
  final String? nameEn;
  final String slug;
  final String? initial;
  final String? bgColorHex;
  final bool isFeatured;
  final String? cardSize;
  final String? link;
  final AppMedia? logo;
  final int productCount;

  const Brand({
    required this.id,
    required this.name,
    this.nameAr,
    this.nameEn,
    required this.slug,
    this.initial,
    this.bgColorHex,
    this.isFeatured = false,
    this.cardSize,
    this.link,
    this.logo,
    this.productCount = 0,
  });

  factory Brand.fromJson(Map<String, dynamic> json) => Brand(
        id: asString(json['id']),
        name: asString(json['name']),
        nameAr: json['nameAr']?.toString(),
        nameEn: json['nameEn']?.toString(),
        slug: asString(json['slug']),
        initial: json['initial']?.toString(),
        bgColorHex: json['bgColorHex']?.toString(),
        isFeatured: asBool(json['isFeatured']),
        cardSize: json['cardSize']?.toString(),
        link: json['link']?.toString(),
        logo: json['logo'] is Map ? AppMedia.fromJson(asMap(json['logo'])) : null,
        productCount: asInt(json['productCount']),
      );

  String localizedName(String lang) => localizedText(
        languageCode: lang,
        ar: nameAr,
        en: nameEn,
        fallback: name,
      );

  String get logoUrl => logo?.thumb ?? '';
}
