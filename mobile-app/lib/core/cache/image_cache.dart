import 'dart:collection';
import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

import '../utils/media_url.dart';

/// مدير كاش الصور — مدة أقصر حتى تظهر تحديثات صور المنتجات أسرع.
class AppImageCacheManager extends CacheManager with ImageCacheManager {
  static const _key = 'alhayaaImages_v3';

  static final AppImageCacheManager instance = AppImageCacheManager._();

  AppImageCacheManager._()
      : super(
          Config(
            _key,
            stalePeriod: const Duration(hours: 12),
            maxNrOfCacheObjects: 1000,
            fileService: HttpFileService(),
          ),
        );
}

/// يضبط حدود كاش Flutter للصور في الذاكرة.
///
/// الصور تُفكّ بحجم عرضها الفعلي، فـ100MB تكفي؛ والهواتف ذات الشاشات الصغيرة
/// (أقصر ضلع < 1080 بكسل — غالباً ذاكرة 2–3GB) تأخذ 64MB حتى لا يُغلق النظام التطبيق.
void configureImageCache() {
  final cache = PaintingBinding.instance.imageCache;
  cache.maximumSize = 320;
  final physical = _physicalScreenSize();
  _applyImageCacheBytes(cache, physical);
  // مقاس الشاشة لم يصل بعد (قبل أول إطار): نعيد الحساب بعده.
  if (physical.isEmpty) {
    WidgetsBinding.instance.addPostFrameCallback((_) => _applyImageCacheBytes(cache, _physicalScreenSize()));
  }
}

Size _physicalScreenSize() {
  final dispatcher = PlatformDispatcher.instance;
  final view = dispatcher.implicitView ?? (dispatcher.views.isEmpty ? null : dispatcher.views.first);
  return view?.physicalSize ?? Size.zero;
}

void _applyImageCacheBytes(ImageCache cache, Size physical) {
  final lowEnd = !physical.isEmpty && physical.shortestSide < 1080;
  cache.maximumSizeBytes = (lowEnd ? 64 : 100) << 20;
}

/// يحسب عرض الكاش المناسب حسب حجم العرض على الشاشة.
int cachePixelWidth(BuildContext context, double? layoutWidth) {
  final dpr = MediaQuery.devicePixelRatioOf(context);
  if (layoutWidth != null && layoutWidth.isFinite && layoutWidth > 0) {
    return _bucket((layoutWidth * dpr).round()).clamp(64, 1600);
  }
  final screenW = MediaQuery.sizeOf(context).width;
  return (screenW * dpr * 0.48).round().clamp(200, 1000);
}

/// تقريب لأعلى إلى خطوة ثابتة: عروض متقاربة (بطاقة 156 في صف و158 في شبكة) أو صندوق
/// يتغيّر عرضه أثناء حركة تشترك في نسخة مفكوكة واحدة بدل فكّ جديد لكل بكسل.
int _bucket(int px) {
  final step = px < 256 ? 32 : 64;
  return (px + step - 1) ~/ step * step;
}

/// تسخين كاش القرص لصورة واحدة: تنزيل الملف فقط، بلا فكّ.
///
/// الفكّ يحدث عند العرض بحجم الويدجت الفعلي — فكّ مسبق بحجم مخمَّن كان نسخة ثانية
/// في الذاكرة لا يقرؤها أحد. [layoutWidth] باقٍ للتوافق مع الاستدعاءات القديمة.
Future<void> precacheAppImage(
  BuildContext context,
  String url, {
  double? layoutWidth,
}) =>
    _warm(resolveMediaUrl(url));

/// تسخين كاش القرص لأغلفة منتجات القائمة — بطابور محدود لا يزاحم الصور الظاهرة.
void precacheProductCovers(
  BuildContext context,
  Iterable<String> urls, {
  int limit = 24,
  double layoutWidth = 180,
}) {
  warmImageDiskCache(urls.where((u) => u.isNotEmpty).take(limit));
}

/// أقصى عدد تنزيلات تسخين متزامنة — الباقي ينتظر دوره.
const _maxWarmInFlight = 4;

final _warmQueue = Queue<String>();
final _warmQueued = <String>{};
var _warmInFlight = 0;

/// يضيف روابط لطابور تسخين كاش القرص (بلا تكرار) — 4 تنزيلات على الأكثر في آن واحد.
void warmImageDiskCache(Iterable<String> urls) {
  for (final raw in urls) {
    final url = resolveMediaUrl(raw);
    if (url.isEmpty || !_warmQueued.add(url)) continue;
    _warmQueue.add(url);
  }
  _pumpWarmQueue();
}

void _pumpWarmQueue() {
  while (_warmInFlight < _maxWarmInFlight && _warmQueue.isNotEmpty) {
    final url = _warmQueue.removeFirst();
    _warmInFlight++;
    _warm(url).whenComplete(() {
      _warmInFlight--;
      _warmQueued.remove(url);
      _pumpWarmQueue();
    });
  }
}

/// ملف موجود حديث يعود من القرص فوراً؛ الأخطاء (لا إنترنت، 404) تُتجاهل —
/// الويدجت نفسها تعيد المحاولة وتعرض البديل عند الحاجة.
Future<void> _warm(String url) async {
  if (url.isEmpty) return;
  try {
    await AppImageCacheManager.instance.getSingleFile(url);
  } catch (_) {}
}
