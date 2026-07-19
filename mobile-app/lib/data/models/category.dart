import '../../core/utils/json.dart';
import 'media.dart';

class Category {
  final String id;
  final String name;
  final String slug;
  final String? icon;
  final String? parentId;
  final String? cardSize;
  final String? link;
  final String? linkType;
  final String? linkValue;
  final String? description;
  final String? rawImageUrl;
  final AppMedia? image;
  final List<Category> children;

  const Category({
    required this.id,
    required this.name,
    required this.slug,
    this.icon,
    this.parentId,
    this.cardSize,
    this.link,
    this.linkType,
    this.linkValue,
    this.description,
    this.rawImageUrl,
    this.image,
    this.children = const [],
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: asString(json['id']),
        name: asString(json['name']),
        slug: asString(json['slug']),
        icon: json['icon']?.toString(),
        parentId: json['parentId']?.toString(),
        cardSize: json['cardSize']?.toString(),
        link: json['link']?.toString(),
        linkType: json['linkType']?.toString(),
        linkValue: json['linkValue']?.toString(),
        description: json['description']?.toString(),
        rawImageUrl: json['imageUrl']?.toString(),
        image: json['image'] is Map ? AppMedia.fromJson(asMap(json['image'])) : null,
        children: asList(json['children']).map(Category.fromJson).toList(),
      );

  String get imageUrl {
    if (rawImageUrl != null && rawImageUrl!.isNotEmpty) return rawImageUrl!;
    return image?.thumb ?? '';
  }
}
