import '../../core/utils/json.dart';
import '../../core/utils/media_url.dart';
import '../../core/l10n/localized_text.dart';
import 'media.dart';

class Category {
  final String id;
  final String name;
  final String? nameAr;
  final String? nameEn;
  final String slug;
  final String? icon;
  final String? parentId;
  final String? cardSize;
  final String? link;
  final String? linkType;
  final String? linkValue;
  final String? description;
  final String? descriptionEn;
  final String? rawImageUrl;
  final AppMedia? image;
  final List<Category> children;

  const Category({
    required this.id,
    required this.name,
    this.nameAr,
    this.nameEn,
    required this.slug,
    this.icon,
    this.parentId,
    this.cardSize,
    this.link,
    this.linkType,
    this.linkValue,
    this.description,
    this.descriptionEn,
    this.rawImageUrl,
    this.image,
    this.children = const [],
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: asString(json['id']),
        name: asString(json['name']),
        nameAr: json['nameAr']?.toString(),
        nameEn: json['nameEn']?.toString(),
        slug: asString(json['slug']),
        icon: json['icon']?.toString(),
        parentId: json['parentId']?.toString(),
        cardSize: json['cardSize']?.toString(),
        link: json['link']?.toString(),
        linkType: json['linkType']?.toString(),
        linkValue: json['linkValue']?.toString(),
        description: json['description']?.toString(),
        descriptionEn: json['descriptionEn']?.toString(),
        rawImageUrl: json['imageUrl']?.toString(),
        image: json['image'] is Map ? AppMedia.fromJson(asMap(json['image'])) : null,
        children: asList(json['children']).map(Category.fromJson).toList(),
      );

  String localizedName(String lang) => localizedText(
        languageCode: lang,
        ar: nameAr,
        en: nameEn,
        fallback: name,
      );

  String localizedDescription(String lang) => localizedText(
        languageCode: lang,
        ar: description,
        en: descriptionEn,
        fallback: '',
      );

  String get imageUrl {
    if (rawImageUrl != null && rawImageUrl!.isNotEmpty) {
      return resolveMediaUrl(rawImageUrl);
    }
    return image?.thumb ?? '';
  }
}
