import '../models/product_model.dart';
import '../models/product_shade.dart';

/// Maps a backend Product DTO (with nested images/variants) to ProductModel.
class ProductRemoteMapper {
  static ProductModel fromJson(Map<String, dynamic> json) {
    final images = <String>[];
    final rawImages = json['images'];
    if (rawImages is List) {
      for (final img in rawImages) {
        final media = (img is Map<String, dynamic>) ? img['media'] : null;
        if (media is Map<String, dynamic>) {
          final variants = media['variants'];
          String? best;
          if (variants is Map<String, dynamic>) {
            for (final size in const ['medium', 'large', 'small', 'thumb']) {
              final formats = (variants[size] as Map<String, dynamic>?)?['formats']
                  as Map<String, dynamic>?;
              if (formats == null) continue;
              best = (formats['webp'] ?? formats['jpg'] ?? formats['avif']) as String?;
              if (best != null && best.isNotEmpty) break;
            }
          }
          if (best != null) images.add(best);
        }
      }
    }
    if (images.isEmpty) {
      images.add('https://placehold.co/600x600/png?text=No+Image');
    }

    final shades = <ProductShade>[];
    final rawShades = json['shades'];
    if (rawShades is List) {
      for (final s in rawShades) {
        if (s is Map<String, dynamic>) {
          shades.add(
            ProductShade(
              name: (s['name'] as String?) ?? '',
              colorHex: (s['colorHex'] as String?) ?? '#000000',
            ),
          );
        }
      }
    }

    return ProductModel(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? '',
      brand: (json['brand'] is Map<String, dynamic>
              ? (json['brand']['name'] as String?)
              : (json['brand'] as String?)) ??
          '',
      brandId: (json['brandId'] as String?) ?? '',
      categoryId: (json['categoryId'] as String?) ?? '',
      subcategoryId: (json['subcategoryId'] as String?) ?? '',
      price: (json['price'] as num?)?.toInt() ?? 0,
      originalPrice: (json['originalPrice'] as num?)?.toInt() ?? 0,
      discountPercent: (json['discountPercent'] as num?)?.toInt() ?? 0,
      images: images,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      soldCount: (json['soldCount'] as num?)?.toInt() ?? 0,
      description: (json['description'] as String?) ?? '',
      ingredients: (json['ingredients'] as String?) ?? '',
      howToUse: (json['howToUse'] as String?) ?? '',
      shades: shades.isEmpty ? null : shades,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      isNew: json['isNew'] as bool? ?? false,
      isBestSeller: json['isBestSeller'] as bool? ?? false,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isPromo: json['isPromo'] as bool? ?? false,
      isBogo: json['isBogo'] as bool? ?? false,
      skinType: ((json['skinType'] as List?) ?? const []).cast<String>(),
      pointsEarned: (json['pointsEarned'] as num?)?.toInt() ?? 0,
      tags: ((json['tags'] as List?) ?? const []).cast<String>(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
