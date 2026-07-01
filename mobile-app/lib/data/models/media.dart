import '../../core/utils/json.dart';
import '../../core/utils/media_url.dart';

class AppMedia {
  final String id;
  final String? alt;
  final Map<String, dynamic> variants;
  final String publicUrlBase;
  final String filename;

  const AppMedia({
    required this.id,
    this.alt,
    this.variants = const {},
    this.publicUrlBase = '',
    this.filename = '',
  });

  factory AppMedia.fromJson(Map<String, dynamic> json) => AppMedia(
        id: asString(json['id']),
        alt: json['alt']?.toString(),
        variants: asMap(json['variants']),
        publicUrlBase: asString(json['publicUrlBase']),
        filename: asString(json['filename']),
      );

  String? _variantPath(String size) {
    final formats = asMap(asMap(variants[size])['formats']);
    return (formats['webp'] ?? formats['jpg'] ?? formats['avif'])?.toString();
  }

  /// رابط مناسب لبطاقات المنتجات.
  String get thumb {
    final rel = _variantPath('medium') ?? _variantPath('thumb') ?? _variantPath('small');
    if (rel != null) return resolveMediaUrl(rel);
    if (publicUrlBase.isNotEmpty && filename.isNotEmpty) {
      return resolveMediaUrl('$publicUrlBase/$filename.webp');
    }
    return '';
  }

  /// رابط عالي الجودة لصفحة التفاصيل.
  String get full {
    final rel = _variantPath('large') ?? _variantPath('medium') ?? _variantPath('thumb');
    if (rel != null) return resolveMediaUrl(rel);
    return thumb;
  }
}
