import '../../core/utils/json.dart';
import 'media.dart';

class Category {
  final String id;
  final String name;
  final String slug;
  final String? icon;
  final String? parentId;
  final AppMedia? image;
  final List<Category> children;

  const Category({
    required this.id,
    required this.name,
    required this.slug,
    this.icon,
    this.parentId,
    this.image,
    this.children = const [],
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: asString(json['id']),
        name: asString(json['name']),
        slug: asString(json['slug']),
        icon: json['icon']?.toString(),
        parentId: json['parentId']?.toString(),
        image: json['image'] is Map ? AppMedia.fromJson(asMap(json['image'])) : null,
        children: asList(json['children']).map(Category.fromJson).toList(),
      );

  String get imageUrl => image?.thumb ?? '';
}
