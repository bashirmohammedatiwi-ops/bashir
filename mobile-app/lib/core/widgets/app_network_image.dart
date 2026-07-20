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
  /// خلفية ثابتة خلف الصورة — ضرورية لـ PNG الشفاف.
  final Color? backgroundColor;

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
    this.backgroundColor,
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

      final image = CachedNetworkImage(
        imageUrl: url,
        cacheManager: AppImageCacheManager.instance,
        width: backgroundColor == null ? width : null,
        height: backgroundColor == null ? height : null,
        fit: fit,
        fadeInDuration: const Duration(milliseconds: 60),
        fadeOutDuration: Duration.zero,
        memCacheWidth: pixelW,
        memCacheHeight: pixelH,
        maxWidthDiskCache: pixelW,
        maxHeightDiskCache: pixelH,
        filterQuality: FilterQuality.medium,
        placeholder: (_, __) => _solid(placeholderColor ?? AppColors.shimmerBase),
        errorWidget: (_, __, ___) => _fallback(),
        imageBuilder: (context, imageProvider) => Image(
          image: imageProvider,
          fit: fit,
          filterQuality: FilterQuality.medium,
          gaplessPlayback: true,
        ),
      );

      if (backgroundColor != null) {
        child = SizedBox(
          width: width,
          height: height,
          child: ColoredBox(
            color: backgroundColor!,
            child: image,
          ),
        );
      } else {
        child = image;
      }
    }

    if (radius != null) {
      return ClipRRect(borderRadius: radius!, child: child);
    }
    return child;
  }

  Widget _solid(Color color) {
    return Container(width: width, height: height, color: color);
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

/// غلاف المنتج — خلفية بيضاء دائماً (مناسبة لصور PNG الشفافة).
class ProductCoverImage extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;

  static const Color wellColor = Colors.white;

  const ProductCoverImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = width ??
            (constraints.maxWidth.isFinite && constraints.maxWidth > 0
                ? constraints.maxWidth
                : null);
        final h = height ??
            (constraints.maxHeight.isFinite && constraints.maxHeight > 0
                ? constraints.maxHeight
                : null);

        if (url.isEmpty) {
          return SizedBox(
            width: w,
            height: h,
            child: ColoredBox(
              color: wellColor,
              child: Center(
                child: Image.asset(
                  _fallbackAsset,
                  width: (w != null && w > 48) ? w * 0.45 : 48,
                  height: (h != null && h > 48) ? h * 0.45 : 48,
                  fit: BoxFit.contain,
                ),
              ),
            ),
          );
        }

        final pixelW = cachePixelWidth(context, w);
        final pixelH = h != null && h.isFinite
            ? (h * MediaQuery.devicePixelRatioOf(context)).ceil()
            : null;

        return SizedBox(
          width: w,
          height: h,
          child: Stack(
            fit: StackFit.expand,
            children: [
              const ColoredBox(color: wellColor),
              CachedNetworkImage(
                imageUrl: url,
                cacheManager: AppImageCacheManager.instance,
                fit: fit,
                fadeInDuration: const Duration(milliseconds: 60),
                fadeOutDuration: Duration.zero,
                memCacheWidth: pixelW,
                memCacheHeight: pixelH,
                maxWidthDiskCache: pixelW,
                maxHeightDiskCache: pixelH,
                filterQuality: FilterQuality.medium,
                placeholder: (_, __) => const SizedBox.shrink(),
                errorWidget: (_, __, ___) => Center(
                  child: Image.asset(
                    _fallbackAsset,
                    width: (w != null && w > 48) ? w * 0.45 : 48,
                    fit: BoxFit.contain,
                  ),
                ),
                imageBuilder: (context, imageProvider) => Image(
                  image: imageProvider,
                  fit: fit,
                  filterQuality: FilterQuality.medium,
                  gaplessPlayback: true,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
