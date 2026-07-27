import '../../core/l10n/localized_text.dart' as l10n;
import '../../core/utils/json.dart';
import 'media.dart';

class AppBanner {
  final String id;
  final String? title;
  final String? titleEn;
  final String? subtitle;
  final String? subtitleEn;
  final String? tag;
  final String? tagEn;
  final String? linkType;
  final String? linkValue;
  final String? link;
  final String? discountText;
  final String? discountTextEn;
  final String? backgroundColor;
  final String? cardSize;
  final AppMedia? image;

  const AppBanner({
    required this.id,
    this.title,
    this.titleEn,
    this.subtitle,
    this.subtitleEn,
    this.tag,
    this.tagEn,
    this.linkType,
    this.linkValue,
    this.link,
    this.discountText,
    this.discountTextEn,
    this.backgroundColor,
    this.cardSize,
    this.image,
  });

  factory AppBanner.fromJson(Map<String, dynamic> json) => AppBanner(
        id: asString(json['id']),
        title: json['title']?.toString(),
        titleEn: json['titleEn']?.toString(),
        subtitle: json['subtitle']?.toString(),
        subtitleEn: json['subtitleEn']?.toString(),
        tag: json['tag']?.toString(),
        tagEn: json['tagEn']?.toString(),
        linkType: json['linkType']?.toString(),
        linkValue: (json['linkValue'] ?? json['target'])?.toString(),
        link: json['link']?.toString(),
        discountText: json['discountText']?.toString(),
        discountTextEn: json['discountTextEn']?.toString(),
        backgroundColor: json['backgroundColor']?.toString(),
        cardSize: json['cardSize']?.toString(),
        image: json['image'] is Map ? AppMedia.fromJson(asMap(json['image'])) : null,
      );

  String get imageUrl {
    if (image?.hero.isNotEmpty == true) return image!.hero;
    // بانر بدون صورة — نعرض بطاقة نصية ملونة
    return '';
  }

  String? titleForLang(String lang) {
    final val = l10n.localizedText(
      languageCode: lang,
      ar: title,
      en: titleEn,
      fallback: '',
    );
    return val.trim().isEmpty ? null : val;
  }

  bool get hasImage => imageUrl.isNotEmpty;
}
