import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../features/worlds/world_theme.dart';
import '../brand/brand_logo.dart';
import '../cache/image_cache.dart';
import '../theme/app_colors.dart';
import '../utils/media_url.dart';

const _fallbackAsset = 'assets/images/app_icon_brand_foreground.png';

/// العرض المنطقي الذي تُفكّ عليه الصورة. نمرّر العرض فقط (لا الارتفاع) حتى تحافظ الصورة
/// على نسبتها: تمرير الاثنين يفكّها بالمقاس بالضبط فتتشوّه صور المنتجات غير المربعة.
/// مع cover/fitHeight في صندوق أطول من عرضه تُملأ الصورة بالارتفاع، فنفكّ بالضلع الأطول
/// حتى لا تظهر مكبّرة وضبابية.
double? _decodeLogicalWidth(BoxFit fit, double? width, double? height) {
  final w = width != null && width.isFinite && width > 0 ? width : null;
  final h = height != null && height.isFinite && height > 0 ? height : null;
  final fillsHeight = fit == BoxFit.cover || fit == BoxFit.fitHeight;
  if (fillsHeight && w != null && h != null && h > w) return h;
  return w;
}

/// صورة شبكية مع كاش محسّن وتحجيم حسب حجم العرض الفعلي.
///
/// تُفكّ مرة واحدة فقط بعرض الصندوق × كثافة الشاشة. بلا [width] يُقاس العرض من المساحة
/// المتاحة؛ و[decodeWidth] يتجاوز الحساب (عارض الصور بملء الشاشة يحتاج دقة أعلى للتكبير).
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

  /// عرض الفكّ بالبكسل الفعلي — يتجاوز الحساب التلقائي.
  final int? decodeWidth;

  /// ما يظهر أثناء التحميل بدل اللون الثابت.
  final Widget? placeholder;

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
    this.decodeWidth,
    this.placeholder,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedUrl = resolveMediaUrl(url);
    Widget child;
    if (resolvedUrl.isEmpty) {
      child = _fallback();
    } else if (decodeWidth != null || (width != null && width!.isFinite)) {
      child = _image(context, resolvedUrl, width, height);
    } else {
      // بلا عرض محدد: نقيس الصندوق الفعلي بدل تخمين نصف الشاشة.
      child = LayoutBuilder(
        builder: (context, c) => _image(
          context,
          resolvedUrl,
          c.hasBoundedWidth && c.maxWidth > 0 ? c.maxWidth : null,
          height != null && height!.isFinite ? height : (c.hasBoundedHeight ? c.maxHeight : null),
        ),
      );
    }

    if (radius != null) {
      return ClipRRect(borderRadius: radius!, child: child);
    }
    return child;
  }

  Widget _image(BuildContext context, String resolvedUrl, double? layoutWidth, double? layoutHeight) {
    final pixelW = decodeWidth ?? cachePixelWidth(context, _decodeLogicalWidth(fit, layoutWidth, layoutHeight));

    final image = CachedNetworkImage(
      imageUrl: resolvedUrl,
      cacheManager: AppImageCacheManager.instance,
      width: backgroundColor == null ? width : null,
      height: backgroundColor == null ? height : null,
      fit: fit,
      filterQuality: FilterQuality.medium,
      fadeInDuration: Duration.zero,
      fadeOutDuration: Duration.zero,
      useOldImageOnUrlChange: true,
      memCacheWidth: pixelW,
      maxWidthDiskCache: pixelW,
      // مع خلفية مخصّصة تظهر الخلفية نفسها أثناء التحميل — لا أشرطة رمادية.
      placeholder: (_, __) =>
          placeholder ??
          (backgroundColor != null ? const SizedBox.expand() : _solid(placeholderColor ?? AppColors.shimmerBase)),
      errorWidget: (_, __, ___) => _fallback(),
    );

    if (backgroundColor == null) return image;
    return SizedBox(
      width: width,
      height: height,
      child: ColoredBox(color: backgroundColor!, child: image),
    );
  }

  Widget _solid(Color color) {
    // يملأ المساحة المتاحة حتى بدون أبعاد صريحة.
    return LayoutBuilder(
      builder: (context, c) => Container(
        width: width ?? (c.hasBoundedWidth ? c.maxWidth : 0),
        height: height ?? (c.hasBoundedHeight ? c.maxHeight : 0),
        color: color,
      ),
    );
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
  final FilterQuality filterQuality;

  /// عرض الفكّ بالبكسل الفعلي — يتجاوز الحساب التلقائي.
  final int? decodeWidth;

  static const Color wellColor = Colors.white;

  const ProductCoverImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.filterQuality = FilterQuality.medium,
    this.decodeWidth,
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

        final resolvedUrl = resolveMediaUrl(url);
        final pixelW = decodeWidth ?? cachePixelWidth(context, _decodeLogicalWidth(fit, w, h));
        // علامة ثابتة بلون الخط الفاصل — لا مؤشرات دوّارة في كل بطاقة أثناء التمرير.
        final mark = Center(child: BrandMark(height: 26, color: context.worldTheme.hairline));

        return SizedBox(
          width: w,
          height: h,
          child: Stack(
            fit: StackFit.expand,
            children: [
              const ColoredBox(color: wellColor),
              CachedNetworkImage(
                imageUrl: resolvedUrl,
                cacheManager: AppImageCacheManager.instance,
                fit: fit,
                filterQuality: filterQuality,
                fadeInDuration: const Duration(milliseconds: 60),
                fadeOutDuration: Duration.zero,
                useOldImageOnUrlChange: true,
                memCacheWidth: pixelW,
                maxWidthDiskCache: pixelW,
                placeholder: (_, __) => ColoredBox(color: wellColor, child: mark),
                errorWidget: (_, __, ___) => Center(
                  child: Image.asset(
                    _fallbackAsset,
                    width: (w != null && w > 48) ? w * 0.45 : 48,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
