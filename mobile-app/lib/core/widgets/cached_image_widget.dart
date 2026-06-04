import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../constants/app_colors.dart';
import 'network_image_platform.dart';

class CachedImageWidget extends StatelessWidget {
  const CachedImageWidget({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.transparentPlaceholder = false,
  });

  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  /// When true, loading/error states stay transparent (for PNG cutouts on colored backdrops).
  final bool transparentPlaceholder;

  static bool isAssetPath(String path) =>
      path.startsWith('assets/') && !path.startsWith('http');

  static bool isNetworkUrl(String url) =>
      url.startsWith('http://') || url.startsWith('https://');

  static int? _memCacheDimension(double? size, double dpr) {
    if (kIsWeb) return null;
    if (size == null || !size.isFinite || size <= 0) return null;
    return (size * dpr).round();
  }

  @override
  Widget build(BuildContext context) {
    final dpr = MediaQuery.devicePixelRatioOf(context);
    final memW = _memCacheDimension(width, dpr);
    final memH = _memCacheDimension(height, dpr);

    Widget image;
    if (isAssetPath(imageUrl)) {
      image = Image.asset(
        imageUrl,
        width: width,
        height: height,
        fit: fit,
        filterQuality: FilterQuality.medium,
        gaplessPlayback: true,
        errorBuilder: (_, __, ___) => _errorBox(),
      );
    } else if (isNetworkUrl(imageUrl)) {
      image = buildPlatformNetworkImage(
        imageUrl: imageUrl,
        width: width,
        height: height,
        fit: fit,
        memCacheWidth: memW,
        memCacheHeight: memH,
        placeholder: _placeholder,
        errorWidget: _errorBox,
      );
    } else {
      image = _errorBox();
    }

    if (borderRadius != null) {
      image = ClipRRect(borderRadius: borderRadius!, child: image);
    }

    return image;
  }

  Widget _placeholder() {
    if (transparentPlaceholder) {
      return SizedBox(width: width, height: height);
    }
    return Shimmer.fromColors(
      baseColor: AppColors.divider,
      highlightColor: AppColors.accent,
      child: Container(
        width: width,
        height: height,
        color: AppColors.divider,
      ),
    );
  }

  Widget _errorBox() {
    if (transparentPlaceholder) {
      return SizedBox(
        width: width,
        height: height,
        child: const Icon(
          Icons.image_not_supported_outlined,
          color: AppColors.textSecondary,
          size: 28,
        ),
      );
    }
    return Container(
      width: width,
      height: height,
      color: AppColors.accent,
      child: const Icon(Icons.image_not_supported, color: AppColors.primary),
    );
  }
}
