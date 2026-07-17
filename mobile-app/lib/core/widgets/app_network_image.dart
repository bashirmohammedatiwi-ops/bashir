import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../cache/image_cache.dart';
import '../theme/app_colors.dart';

const _fallbackAsset = 'assets/images/alhayaa_logo.png';

/// صورة شبكية مع كاش محسّن وتحجيم حسب حجم العرض الفعلي.
class AppNetworkImage extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? radius;
  final String? fallbackAsset;
  final Color? placeholderColor;
  final Color? fallbackColor;

  const AppNetworkImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.radius,
    this.fallbackAsset,
    this.placeholderColor,
    this.fallbackColor,
  });

  @override
  Widget build(BuildContext context) {
    Widget child;
    if (url.isEmpty) {
      child = _fallback();
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
        filterQuality: FilterQuality.high,
        placeholder: (_, __) => Container(color: placeholderColor ?? AppColors.shimmerBase),
        errorWidget: (_, __, ___) => _fallback(),
      );
    }
    if (radius != null) {
      return ClipRRect(borderRadius: radius!, child: child);
    }
    return child;
  }

  Widget _fallback() {
    final asset = fallbackAsset ?? _fallbackAsset;
    return Container(
      width: width,
      height: height,
      color: fallbackColor ?? const Color(0xFFF7F7F7),
      alignment: Alignment.center,
      child: Image.asset(
        asset,
        width: (width != null && width! > 48) ? width! * 0.45 : 48,
        height: (height != null && height! > 48) ? height! * 0.45 : 48,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.medium,
      ),
    );
  }
}

/// غلاف المنتج — شبكة أو شعار محلي.
class ProductCoverImage extends StatelessWidget {
  final String url;
  final double? width;
  final BoxFit fit;

  const ProductCoverImage({
    super.key,
    required this.url,
    this.width,
    this.fit = BoxFit.contain,
  });

  @override
  Widget build(BuildContext context) {
    return AppNetworkImage(
      url: url,
      width: width,
      fit: fit,
      placeholderColor: AppColors.surface,
      fallbackColor: AppColors.surface,
    );
  }
}
