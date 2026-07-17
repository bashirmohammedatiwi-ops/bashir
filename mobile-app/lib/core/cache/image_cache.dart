import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

/// مدير كاش الصور — مدة أقصر حتى تظهر تحديثات صور المنتجات أسرع.
class AppImageCacheManager extends CacheManager with ImageCacheManager {
  static const _key = 'alhayaaImages_v2';

  static final AppImageCacheManager instance = AppImageCacheManager._();

  AppImageCacheManager._()
      : super(
          Config(
            _key,
            stalePeriod: const Duration(days: 3),
            maxNrOfCacheObjects: 800,
            fileService: HttpFileService(),
          ),
        );
}

/// يضبط حدود كاش Flutter للصور في الذاكرة.
void configureImageCache() {
  final cache = PaintingBinding.instance.imageCache;
  cache.maximumSize = 280;
  cache.maximumSizeBytes = 140 << 20; // 140 MB
}

/// يحسب عرض الكاش المناسب حسب حجم العرض على الشاشة.
int cachePixelWidth(BuildContext context, double? layoutWidth) {
  final dpr = MediaQuery.devicePixelRatioOf(context);
  if (layoutWidth != null && layoutWidth.isFinite && layoutWidth > 0) {
    return (layoutWidth * dpr).ceil().clamp(64, 1600);
  }
  final screenW = MediaQuery.sizeOf(context).width;
  return (screenW * dpr * 0.48).round().clamp(200, 1000);
}

/// تحميل مسبق لصورة واحدة بالحجم المناسب للبطاقات.
Future<void> precacheAppImage(
  BuildContext context,
  String url, {
  double? layoutWidth,
}) {
  if (url.isEmpty) return Future.value();
  final w = cachePixelWidth(context, layoutWidth);
  return precacheImage(
    CachedNetworkImageProvider(
      url,
      cacheManager: AppImageCacheManager.instance,
      maxWidth: w,
    ),
    context,
  );
}

/// تحميل مسبق لأغلفة منتجات القائمة.
void precacheProductCovers(
  BuildContext context,
  Iterable<String> urls, {
  int limit = 16,
  double layoutWidth = 180,
}) {
  var count = 0;
  for (final url in urls) {
    if (url.isEmpty) continue;
    if (count >= limit) break;
    precacheAppImage(context, url, layoutWidth: layoutWidth);
    count++;
  }
}
