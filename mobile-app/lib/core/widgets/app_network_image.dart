import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// صورة شبكية مع كاش وتحميل سلس وبديل عند الفشل.
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
      child = CachedNetworkImage(
        imageUrl: url,
        width: width,
        height: height,
        fit: fit,
        fadeInDuration: const Duration(milliseconds: 200),
        memCacheWidth: width != null && width != double.infinity
            ? (width! * 2.5).round()
            : 720,
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
