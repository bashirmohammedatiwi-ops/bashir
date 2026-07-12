import '../../core/utils/json.dart';
import 'media.dart';

class AppBanner {
  final String id;
  final String? title;
  final String? subtitle;
  final String? tag;
  final String? linkType;
  final String? linkValue;
  final String? discountText;
  final String? backgroundColor;
  final String? cardSize;
  final AppMedia? image;

  const AppBanner({
    required this.id,
    this.title,
    this.subtitle,
    this.tag,
    this.linkType,
    this.linkValue,
    this.discountText,
    this.backgroundColor,
    this.cardSize,
    this.image,
  });

  factory AppBanner.fromJson(Map<String, dynamic> json) => AppBanner(
        id: asString(json['id']),
        title: json['title']?.toString(),
        subtitle: json['subtitle']?.toString(),
        tag: json['tag']?.toString(),
        linkType: json['linkType']?.toString(),
        linkValue: (json['linkValue'] ?? json['link'] ?? json['target'])?.toString(),
        discountText: json['discountText']?.toString(),
        backgroundColor: json['backgroundColor']?.toString(),
        cardSize: json['cardSize']?.toString(),
        image: json['image'] is Map ? AppMedia.fromJson(asMap(json['image'])) : null,
      );

  String get imageUrl {
    if (image?.hero.isNotEmpty == true) return image!.hero;
    // بانر بدون صورة — نعرض بطاقة نصية ملونة
    return '';
  }

  bool get hasImage => imageUrl.isNotEmpty;
}
