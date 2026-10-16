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

  String localizedName(String lang) {
    final parts = splitBrandName(name);
    return localizedText(
      languageCode: lang,
      ar: (nameAr?.trim().isNotEmpty ?? false) ? nameAr : parts.ar,
      en: (nameEn?.trim().isNotEmpty ?? false) ? nameEn : parts.en,
      fallback: name,
    );
  }

  /// اسم قصير للبطاقات والشعارات: الاسم اللاتيني (هوية البراند) إن وُجد.
  String get label {
    final en = nameEn?.trim();
    if (en != null && en.isNotEmpty) return en;
    return splitBrandName(name).en ?? name;
  }

  String get logoUrl => logo?.thumb ?? '';
}

final _arabicChar = RegExp(r'[\u0600-\u06FF]');

/// «غولدن روز Golden Rose» ← (ar: «غولدن روز»، en: «Golden Rose»). للاسم بلغة واحدة: null للأخرى.
({String? ar, String? en}) splitBrandName(String name) {
  final words = name.trim().split(RegExp(r'\s+'));
  final ar = words.where((w) => _arabicChar.hasMatch(w)).join(' ');
  final en = words.where((w) => !_arabicChar.hasMatch(w)).join(' ').trim();
  if (ar.isEmpty || en.isEmpty || !RegExp(r'[A-Za-zÀ-ÿ]').hasMatch(en)) return (ar: ar.isEmpty ? null : name, en: en.isEmpty ? null : name);
  return (ar: ar, en: en);
}
