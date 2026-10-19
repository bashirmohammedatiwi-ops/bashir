import '../../core/perf/device_perf.dart';
import '../../core/utils/json.dart';
import '../../core/utils/media_url.dart';

/// مقاسات صور السيرفر بالترتيب — تطابق IMAGE_VARIANTS في backend/media.constants.ts.
const _variantLadder = <(String, int)>[
  ('thumb', 320),
  ('small', 640),
  ('medium', 1000),
  ('large', 1600),
];

/// لاحقة مقاس في اسم الملف: `<base>_medium.webp` (قبل الاستعلام `?v=` إن وُجد).
final _variantSuffix = RegExp(r'_(thumb|small|medium|large)\.(webp|jpe?g|avif)$', caseSensitive: false);

/// يبدّل مقاس صورة سيرفرنا إلى أصغر مقاس يغطي [pixelWidth] بكسل فعلي.
///
/// كثير من الروابط تأتي من السيرفر نصاً جاهزاً (medium أو large لأيقونة 40pt)،
/// فيختار هذا المقاس حسب حجم الظهور الفعلي، ويُبقي الاستعلام (`?v=`) كما هو.
/// - روابط ليست بنمط `/media/…/<base>_<size>.<ext>` تبقى كما هي.
/// - لا يكبّر من thumb أبداً: thumb وحده يُكتب لحظة الرفع والباقي يُولَّد بعدها بثوانٍ،
///   فرابط thumb قد يعني أن الباقي لم يُولَّد بعد. أي مقاس غيره يعني أن الأربعة موجودة
///   (السيرفر يحفظ قائمة المقاسات بعد توليدها كلها).
/// - المقاس الجديد بصيغة webp دائماً (موجودة لكل المقاسات؛ jpg لـlarge فقط).
/// - الأجهزة البسيطة تقبل مقاساً يغطي ~85% من العرض (فرق لا يُرى، وذاكرة أقل).
///
/// توحيد المفاتيح: الرابط نفسه (مع `?v=` أو بدونه) هو مفتاح الكاش، فاختيار المقاس من
/// حجم الظهور يجعل الشاشات المختلفة تتلاقى على الملفات نفسها بدل نسخ بمقاسات متفرقة.
String mediaVariantFor(String url, int pixelWidth) {
  if (url.isEmpty || pixelWidth <= 0 || !url.contains('/media/')) return url;
  final cut = url.indexOf(RegExp(r'[?#]'));
  final path = cut < 0 ? url : url.substring(0, cut);
  final m = _variantSuffix.firstMatch(path);
  if (m == null) return url;

  final current = m.group(1)!.toLowerCase();
  final need = DevicePerf.isLow ? (pixelWidth * 0.85).ceil() : pixelWidth;
  var target = _variantLadder.last.$1;
  for (final (name, width) in _variantLadder) {
    if (width >= need) {
      target = name;
      break;
    }
  }
  if (target == current) return url;
  if (current == 'thumb') return url;
  return '${path.substring(0, m.start)}_$target.webp${cut < 0 ? '' : url.substring(cut)}';
}

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

  String? _originalFileUrl() {
    if (publicUrlBase.isEmpty || filename.isEmpty) return null;
    final base = publicUrlBase.replaceAll(RegExp(r'/+$'), '');
    // مسار ملف صورة كامل (نادر) — لا تخلط مع publicUrlBase الذي يحتوي نقطة من الدومين/IP.
    if (RegExp(r'\.(webp|jpg|jpeg|png|avif)$', caseSensitive: false).hasMatch(base)) {
      return resolveMediaUrl(base);
    }
    return resolveMediaUrl('$base/$filename.webp');
  }

  /// يختار أفضل متغيّر: الأصغر الذي يلبي العرض، أو الأكبر المتاح، ثم الأصل.
  String urlForTargetPixels(int targetPx) {
    String? bestAtOrAbove;
    var bestAtOrAboveWidth = 99999;
    String? largestAvailable;
    var largestWidth = 0;

    for (final entry in variantWidths.entries) {
      final path = _variantPath(entry.key);
      if (path == null) continue;
      final w = entry.value;
      if (w >= targetPx && w < bestAtOrAboveWidth) {
        bestAtOrAboveWidth = w;
        bestAtOrAbove = path;
      } else if (w > largestWidth) {
        largestWidth = w;
        largestAvailable = path;
      }
    }

    if (bestAtOrAbove != null) return _bust(resolveMediaUrl(bestAtOrAbove));
    if (largestAvailable != null) return _bust(resolveMediaUrl(largestAvailable));

    final original = _originalFileUrl();
    if (original != null && original.isNotEmpty) return _bust(original);

    return '';
  }

  /// بطاقات المنتجات والقوائم (~160–200pt).
  String get thumb => urlForTargetPixels(480);

  /// صفحة التفاصيل.
  String get full => urlForTargetPixels(1000);

  /// بانرات وصور كبيرة.
  String get hero => urlForTargetPixels(1400);
}
