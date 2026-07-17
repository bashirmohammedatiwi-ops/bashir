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

  /// أبعاد المتغيرات على السيرفر — يجب أن تطابق backend/media.constants.ts
  static const variantWidths = <String, int>{
    'thumb': 240,
    'small': 480,
    'medium': 800,
    'large': 1200,
  };

  factory AppMedia.fromJson(Map<String, dynamic> json) => AppMedia(
        id: asString(json['id']),
        alt: json['alt']?.toString(),
        variants: asMap(json['variants']),
        publicUrlBase: asString(json['publicUrlBase']),
        filename: asString(json['filename']),
      );

  String? _variantPath(String size) {
    final node = asMap(variants[size]);
    final formats = asMap(node['formats']);
    // AVIF أولاً — أصغر حجماً بنفس الجودة تقريباً، ثم WebP ثم JPG
    final direct =
        (formats['avif'] ?? formats['webp'] ?? formats['jpg'] ?? node['url'])?.toString();
    if (direct != null && direct.isNotEmpty) return direct;
    return null;
  }

  String? _anyVariantUrl() {
    for (final key in ['thumb', 'small', 'medium', 'large']) {
      final p = _variantPath(key);
      if (p != null && p.isNotEmpty) return p;
    }
    return null;
  }

  String? _originalUrl() {
    if (publicUrlBase.isNotEmpty && filename.isNotEmpty) {
      if (publicUrlBase.contains('.')) return resolveMediaUrl(publicUrlBase);
      // Prefer webp original; client will error-fallback via CachedNetworkImage if needed
      return resolveMediaUrl('$publicUrlBase/$filename.webp');
    }
    return null;
  }

  /// يختار أصغر متغيّر يلبي عرض البكسل المطلوب (يوفر بيانات الجوال).
  /// الترتيب: thumb → small → medium → large، مع تفضيل AVIF.
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

    if (bestPath != null) return resolveMediaUrl(bestPath);

    // إن لم تكتمل المتغيرات بعد — استخدم الأصلي فوراً
    final original = _originalUrl();
    if (original != null && original.isNotEmpty) return original;

    for (final name in ['large', 'medium', 'small', 'thumb']) {
      final p = _variantPath(name);
      if (p != null) return resolveMediaUrl(p);
    }

    return '';
  }

  /// رابط مناسب لبطاقات المنتجات والقوائم (~160–180pt عرض).
  String get thumb => urlForTargetPixels(480);

  /// رابط مناسب لصفحة التفاصيل (معرض الصور).
  String get full => urlForTargetPixels(960);

  /// بانرات وصور كبيرة.
  String get hero => urlForTargetPixels(1400);
}
