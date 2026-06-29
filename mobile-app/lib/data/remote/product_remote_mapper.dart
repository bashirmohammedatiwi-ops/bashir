import 'dart:convert';

import '../../core/network/media_url.dart';
import '../models/product_model.dart';
import '../models/product_shade.dart';

/// Maps a backend Product DTO (with nested images/variants) to ProductModel.
class ProductRemoteMapper {
  static String _resolveName(Map<String, dynamic> json) {
    final nameAr = (json['nameAr'] as String?)?.trim();
    if (nameAr != null && nameAr.isNotEmpty) return nameAr;
    final nameEn = (json['nameEn'] as String?)?.trim();
    if (nameEn != null && nameEn.isNotEmpty) return nameEn;
    return (json['name'] as String?)?.trim() ?? '';
  }

  static String _resolveDescription(Map<String, dynamic> json) {
    final descAr = (json['descriptionAr'] as String?)?.trim();
    if (descAr != null && descAr.isNotEmpty) return descAr;
    final descEn = (json['descriptionEn'] as String?)?.trim();
    if (descEn != null && descEn.isNotEmpty) return descEn;
    return (json['description'] as String?)?.trim() ?? '';
  }

  /// قائمة من API قد تكون `[]` أو `"[]"` (حقل Prisma كنص JSON).
  static List<String> parseStringList(dynamic raw) {
    if (raw == null) return const [];
    if (raw is List) {
      return raw.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
    }
    if (raw is String) {
      final trimmed = raw.trim();
      if (trimmed.isEmpty) return const [];
      if (trimmed.startsWith('[')) {
        try {
          final decoded = jsonDecode(trimmed);
          if (decoded is List) {
            return decoded
                .map((e) => e.toString())
                .where((s) => s.isNotEmpty)
                .toList();
          }
        } catch (_) {
          return const [];
        }
      }
      return [trimmed];
    }
    return const [];
  }

  static ProductModel fromJson(Map<String, dynamic> json) {
    final images = <String>[];
    final rawImages = json['images'];
    if (rawImages is List) {
      for (final img in rawImages) {
        if (img is! Map) continue;
        final row = Map<String, dynamic>.from(img);
        final url = resolveMediaUrl(row['media'] ?? row);
        if (url.isNotEmpty) images.add(url);
      }
    }
    if (images.isEmpty) {
      final cover = resolveMediaUrl(json['coverImage'] ?? json['thumbnail']);
      if (cover.isNotEmpty) images.add(cover);
    }
    // لا placeholder خارجي — يفشل أحياناً على الويب ويُخفي الخطأ

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
      id: json['id']?.toString() ?? '',
      name: _resolveName(json),
      brand: (json['brand'] is Map<String, dynamic>
              ? (json['brand']['name'] as String?)
              : (json['brand'] as String?)) ??
          '',
      brandId: json['brandId']?.toString() ?? '',
      categoryId: json['categoryId']?.toString() ?? '',
      subcategoryId: json['subcategoryId']?.toString() ?? '',
      price: (json['price'] as num?)?.toInt() ?? 0,
      originalPrice: (json['originalPrice'] as num?)?.toInt() ?? 0,
      discountPercent: (json['discountPercent'] as num?)?.toInt() ?? 0,
      images: images,
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      soldCount: (json['soldCount'] as num?)?.toInt() ?? 0,
      description: _resolveDescription(json),
      ingredients: (json['ingredients'] as String?) ?? '',
      howToUse: (json['howToUse'] as String?) ?? '',
      shades: shades.isEmpty ? null : shades,
      stock: (json['stock'] as num?)?.toInt() ?? 0,
      isNew: json['isNew'] as bool? ?? false,
      isBestSeller: json['isBestSeller'] as bool? ?? false,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isPromo: json['isPromo'] as bool? ?? false,
      isBogo: json['isBogo'] as bool? ?? false,
      skinType: parseStringList(json['skinType']),
      pointsEarned: (json['pointsEarned'] as num?)?.toInt() ?? 0,
      tags: parseStringList(json['tags']),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}
