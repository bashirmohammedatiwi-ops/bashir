import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// مدير كاش الصور — احتفاظ أطول وحجم أكبر على القرص.
class AppImageCacheManager extends CacheManager with ImageCacheManager {
  static const _key = 'alhayaaImages';

  static final AppImageCacheManager instance = AppImageCacheManager._();

  AppImageCacheManager._()
      : super(
          Config(
            _key,
            stalePeriod: const Duration(days: 14),
            maxNrOfCacheObjects: 600,
            fileService: HttpFileService(),
          ),
        );
}

/// يضبط حدود كاش Flutter للصور في الذاكرة.
void configureImageCache() {
  final cache = PaintingBinding.instance.imageCache;
  cache.maximumSize = 250;
  cache.maximumSizeBytes = 120 << 20; // 120 MB
}

/// يحسب عرض الكاش المناسب حسب حجم العرض على الشاشة.
int cachePixelWidth(BuildContext context, double? layoutWidth) {
  final dpr = MediaQuery.devicePixelRatioOf(context);
  if (layoutWidth != null && layoutWidth.isFinite && layoutWidth > 0) {
    return (layoutWidth * dpr).ceil().clamp(64, 1440);
  }
  final screenW = MediaQuery.sizeOf(context).width;
  return (screenW * dpr * 0.45).round().clamp(200, 900);
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
