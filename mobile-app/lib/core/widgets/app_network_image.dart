import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../cache/image_cache.dart';
import '../theme/app_colors.dart';

/// صورة شبكية مع كاش محسّن وتحجيم حسب حجم العرض الفعلي.
class AppNetworkImage extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? radius;

  const AppNetworkImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.radius,
  });

  @override
  Widget build(BuildContext context) {
    Widget child;
    if (url.isEmpty) {
      child = _placeholder();
    } else {
      final pixelW = cachePixelWidth(context, width);
      final pixelH = height != null && height!.isFinite
          ? (height! * MediaQuery.devicePixelRatioOf(context)).ceil()
          : null;

      child = CachedNetworkImage(
        imageUrl: url,
        cacheManager: AppImageCacheManager.instance,
        width: width,
        height: height,
        fit: fit,
        fadeInDuration: const Duration(milliseconds: 150),
        fadeOutDuration: const Duration(milliseconds: 100),
        memCacheWidth: pixelW,
        memCacheHeight: pixelH,
        maxWidthDiskCache: pixelW,
        maxHeightDiskCache: pixelH,
        filterQuality: FilterQuality.medium,
        placeholder: (_, __) => Container(color: AppColors.shimmerBase),
        errorWidget: (_, __, ___) => _placeholder(),
      );
    }
    if (radius != null) {
      return ClipRRect(borderRadius: radius!, child: child);
    }
    return child;
  }

  Widget _placeholder() => Container(
        width: width,
        height: height,
        color: AppColors.shimmerBase,
        alignment: Alignment.center,
        child: const Icon(Icons.image_outlined, color: AppColors.textMuted, size: 32),
      );
}
