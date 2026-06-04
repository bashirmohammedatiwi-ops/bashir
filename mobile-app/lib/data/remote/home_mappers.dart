import '../../core/network/media_url.dart';
import '../models/banner_model.dart';
import '../models/brand_model.dart';
import '../models/category_model.dart';
import '../models/product_package_model.dart';
class HomeMappers {
  static List<BannerModel> banners(List<Map<String, dynamic>> raw) {
    return raw.map((b) {
      final image = resolveMediaUrl(b['image']);
      final link = b['link']?.toString() ?? b['ctaUrl']?.toString();
      return BannerModel(
        id: b['id']?.toString() ?? '',
        title: b['title']?.toString() ?? '',
        subtitle: b['subtitle']?.toString() ?? '',
        imageUrl: image.isNotEmpty ? image : '',
        actionRoute: _linkToRoute(link),
      );
    }).where((b) => b.id.isNotEmpty).toList();
  }

  static String _categoryIcon(Map<String, dynamic> c) {
    final image = resolveMediaUrl(c['image']);
    if (image.isNotEmpty) return image;
    final icon = c['icon']?.toString();
    if (icon != null && icon.isNotEmpty && icon != 'null') return icon;
    return '🛍️';
  }

  static List<CategoryModel> categories(List<Map<String, dynamic>> raw) {
    return raw.map((c) {
      final map = Map<String, dynamic>.from(c);
      final children = (map['children'] as List?) ?? [];
      return CategoryModel(
        id: map['id']?.toString() ?? map['slug']?.toString() ?? '',
        name: map['name']?.toString() ?? '',
        icon: _categoryIcon(map),
        subcategories: children.map((ch) {
          final m = Map<String, dynamic>.from(ch as Map);
          return SubcategoryModel(
            id: m['id']?.toString() ?? '',
            name: m['name']?.toString() ?? '',
            productCount: (m['productCount'] as num?)?.toInt() ??
                (m['_count'] is Map
                    ? ((m['_count'] as Map)['subcategoryProducts'] as num?)
                        ?.toInt()
                    : null) ??
                0,
            categoryId: map['id']?.toString() ?? '',
          );
        }).toList(),
      );
    }).toList();
  }

  static List<BrandModel> brands(List<Map<String, dynamic>> raw) {
    return raw.map((b) {
      final logo = resolveMediaUrl(b['logo']);
      return BrandModel(
        id: b['id']?.toString() ?? '',
        name: b['name']?.toString() ?? '',
        logoUrl: logo.isNotEmpty ? logo : null,
        productCount: (b['productCount'] as num?)?.toInt() ?? 0,
        isFeatured: b['isFeatured'] == true,
      );
    }).toList();
  }

  static List<ProductPackageModel> packages(List<Map<String, dynamic>> raw) {
    return raw.map((p) {
      final cover = resolveMediaUrl(p['coverImage']);
      final items = (p['items'] as List?) ?? [];
      final productIds = items
          .map((i) {
            final m = Map<String, dynamic>.from(i as Map);
            return (m['product'] as Map?)?['id']?.toString() ??
                m['productId']?.toString();
          })
          .whereType<String>()
          .toList();
      final price = (p['price'] as num?)?.toInt() ?? 0;
      final original = (p['originalPrice'] as num?)?.toInt() ?? price;
      return ProductPackageModel(
        id: p['id']?.toString() ?? '',
        name: p['name']?.toString() ?? '',
        subtitle: p['subtitle']?.toString() ?? '',
        productIds: productIds,
        price: price,
        originalPrice: original > 0 ? original : price,
        coverImageUrl: cover.isNotEmpty
            ? cover
            : 'https://placehold.co/400x300/png?text=Package',
        badge: p['badge']?.toString(),
        isFeatured: p['isFeatured'] == true,
      );
    }).toList();
  }

  static String? _linkToRoute(String? link) {
    if (link == null || link.isEmpty) return null;
    if (link.startsWith('/product/')) return link;
    if (link.startsWith('/category/')) return link.replaceFirst('/category/', '/products?categoryId=');
    if (link.startsWith('/brand/')) return link.replaceFirst('/brand/', '/products?brandId=');
    if (link.startsWith('/package/')) return link;
    return link.startsWith('/') ? link : '/$link';
  }
}
