import '../../core/utils/json.dart';
import 'media.dart';

class Brand {
  final String id;
  final String name;
  final String slug;
  final String? initial;
  final String? bgColorHex;
  final bool isFeatured;
  final String? cardSize;
  final String? link;
  final AppMedia? logo;

  const Brand({
    required this.id,
    required this.name,
    required this.slug,
    this.initial,
    this.bgColorHex,
    this.isFeatured = false,
    this.cardSize,
    this.link,
    this.logo,
  });

  factory Brand.fromJson(Map<String, dynamic> json) => Brand(
        id: asString(json['id']),
        name: asString(json['name']),
        slug: asString(json['slug']),
        initial: json['initial']?.toString(),
        bgColorHex: json['bgColorHex']?.toString(),
        isFeatured: asBool(json['isFeatured']),
        cardSize: json['cardSize']?.toString(),
        link: json['link']?.toString(),
        logo: json['logo'] is Map ? AppMedia.fromJson(asMap(json['logo'])) : null,
      );

  String get logoUrl => logo?.thumb ?? '';
}
