import '../../core/utils/json.dart';
import '../../core/utils/media_url.dart';

class AppMedia {
  final String id;
  final String? alt;
  final Map<String, dynamic> variants;
  final String publicUrlBase;
  final String filename;
  /// يُستخدم لكسر كاش الصور عند استبدال الملف على السيرفر.
  final String? updatedAt;

  const AppMedia({
    required this.id,
    this.alt,
    this.variants = const {},
    this.publicUrlBase = '',
    this.filename = '',
    this.updatedAt,
  });

  /// أبعاد المتغيرات على السيرفر — تطابق backend/media.constants.ts
  static const variantWidths = <String, int>{
    'thumb': 320,
    'small': 640,
    'medium': 1000,
    'large': 1600,
  };

  factory AppMedia.fromJson(Map<String, dynamic> json) => AppMedia(
        id: asString(json['id']),
        alt: json['alt']?.toString(),
        variants: asMap(json['variants']),
        publicUrlBase: asString(json['publicUrlBase']),
        filename: asString(json['filename']),
        updatedAt: json['updatedAt']?.toString(),
      );

  String get _cacheVersion {
    final digits = (updatedAt ?? '').replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) return id;
    return digits.length <= 14 ? digits : digits.substring(0, 14);
  }

  String _bust(String url) {
    if (url.isEmpty) return url;
    final v = _cacheVersion;
    if (v.isEmpty) return url;
    return url.contains('?') ? '$url&v=$v' : '$url?v=$v';
  }

  String? _variantPath(String size) {
    final node = asMap(variants[size]);
    final formats = asMap(node['formats']);
    // WebP أولاً — فكّ أسرع على أغلب الأجهزة من AVIF
    final direct =
        (formats['webp'] ?? formats['jpg'] ?? formats['avif'] ?? node['url'])?.toString();
    if (direct != null && direct.isNotEmpty) return direct;
    return null;
  }

  String? _originalUrl() {
    if (publicUrlBase.isNotEmpty && filename.isNotEmpty) {
      if (publicUrlBase.contains('.')) return resolveMediaUrl(publicUrlBase);
      return resolveMediaUrl('$publicUrlBase/$filename.webp');
    }
    return null;
  }

  /// يختار أصغر متغيّر يلبي عرض البكسل المطلوب.
  String urlForTargetPixels(int targetPx) {
    String? bestPath;
    var bestWidth = 99999;

    for (final entry in variantWidths.entries) {
      final path = _variantPath(entry.key);
      if (path == null) continue;
      final w = entry.value;
      if (w >= targetPx && w < bestWidth) {
        bestWidth = w;
        bestPath = path;
      }
    }

    if (bestPath != null) return _bust(resolveMediaUrl(bestPath));

    final original = _originalUrl();
    if (original != null && original.isNotEmpty) return _bust(original);

    for (final name in ['large', 'medium', 'small', 'thumb']) {
      final p = _variantPath(name);
      if (p != null) return _bust(resolveMediaUrl(p));
    }

    return '';
  }

  /// بطاقات المنتجات والقوائم (~160–200pt).
  String get thumb => urlForTargetPixels(480);

  /// صفحة التفاصيل.
  String get full => urlForTargetPixels(1000);

  /// بانرات وصور كبيرة.
  String get hero => urlForTargetPixels(1400);
}
