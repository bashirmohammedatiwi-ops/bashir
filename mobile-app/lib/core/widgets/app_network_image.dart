import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/gestures.dart' show kTouchSlop;
import 'package:flutter/material.dart';

import '../../data/models/media.dart';
import '../../features/worlds/world_theme.dart';
import '../brand/brand_logo.dart';
import '../cache/image_cache.dart';
import '../utils/media_url.dart';

const _fallbackAsset = 'assets/images/app_icon_brand_foreground.png';

/// عرض فكّ صورة البديل: الملف 1024px، ويظهر بأقل من 120pt — بلا هذا يُفكّ كاملاً (4MB).
const _fallbackCacheWidth = 256;

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

/// آخر عرض فكّ لكل رابط (الرابط كما جاء من السيرفر بعد resolveMediaUrl).
///
/// يتيح لشاشة تالية أن تعرض **النسخة المفكوكة نفسها** الموجودة في الذاكرة — صورة البطاقة
/// مؤقتاً في صفحة المنتج، وصورة المعرض في عارض ملء الشاشة — بلا وميض ولا فكّ جديد.
final _lastDecodeWidths = <String, int>{}; // بترتيب الإدراج: الأقدم أولاً.
const _lastDecodeLimit = 256;

void _rememberDecode(String resolvedUrl, int pixelW) {
  if (resolvedUrl.isEmpty) return;
  _lastDecodeWidths.remove(resolvedUrl);
  _lastDecodeWidths[resolvedUrl] = pixelW;
  if (_lastDecodeWidths.length > _lastDecodeLimit) {
    _lastDecodeWidths.remove(_lastDecodeWidths.keys.first);
  }
}

/// عرض الفكّ الذي ظهرت به [url] آخر مرة (null إن لم تظهر بعد في هذه الجلسة).
int? lastImageDecodeWidth(String url) => _lastDecodeWidths[resolveMediaUrl(url)];

/// صورة شبكية مع كاش محسّن وتحجيم حسب حجم العرض الفعلي.
///
/// تُفكّ مرة واحدة فقط بعرض الصندوق × كثافة الشاشة، ويُنزَّل أصغر مقاس من السيرفر
/// (thumb/small/medium/large) يغطي هذا العرض — مهما كان المقاس في الرابط الأصلي.
/// بلا [width] يُقاس العرض من المساحة المتاحة؛ و[decodeWidth] يتجاوز الحساب
/// (عارض الصور بملء الشاشة يحتاج دقة أعلى للتكبير).
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

  /// ما يظهر عند فشل التحميل بدل شعار المتجر (النقر عليه يعيد المحاولة).
  final Widget? errorWidget;

  final FilterQuality filterQuality;

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
    this.errorWidget,
    this.filterQuality = FilterQuality.medium,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedUrl = resolveMediaUrl(url);
    Widget child;
    if (resolvedUrl.isEmpty) {
      child = errorWidget ?? _fallback(context.worldTheme);
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
    _rememberDecode(resolvedUrl, pixelW);
    final t = context.worldTheme;

    final image = _RetryingNetworkImage(
      url: mediaVariantFor(resolvedUrl, pixelW),
      originalUrl: resolvedUrl,
      memCacheWidth: pixelW,
      width: backgroundColor == null ? width : null,
      height: backgroundColor == null ? height : null,
      fit: fit,
      filterQuality: filterQuality,
      fadeInDuration: Duration.zero,
      // مع خلفية مخصّصة تظهر الخلفية نفسها أثناء التحميل — لا أشرطة رمادية.
      placeholder: (_) =>
          placeholder ??
          (backgroundColor != null ? const SizedBox.expand() : _solid(placeholderColor ?? t.placeholder)),
      error: (_) => errorWidget ?? _fallback(t),
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

  Widget _fallback(WorldThemePalette t) {
    final asset = fallbackAsset ?? _fallbackAsset;
    return Container(
      width: width,
      height: height,
      color: fallbackColor ?? t.fallbackFill,
      alignment: Alignment.center,
      child: Image.asset(
        asset,
        width: (width != null && width! > 48) ? width! * 0.45 : 48,
        height: (height != null && height! > 48) ? height! * 0.45 : 48,
        cacheWidth: _fallbackCacheWidth,
        fit: BoxFit.contain,
        filterQuality: FilterQuality.medium,
      ),
    );
  }
}

/// غلاف المنتج — خلفية بيضاء دائماً، حتى في الوضع الليلي (صور المنتجات وPNG الشفافة
/// مصمّمة على الأبيض؛ البطاقات تحيطها بخط رفيع هناك).
class ProductCoverImage extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final FilterQuality filterQuality;

  /// عرض الفكّ بالبكسل الفعلي — يتجاوز الحساب التلقائي.
  final int? decodeWidth;

  /// صورة منخفضة الدقة تظهر أثناء تحميل [url] — مثلاً غلاف البطاقة المفكوك في الذاكرة
  /// بينما تُحمَّل صورة المعرض الكبيرة (تُعرض بعرض الفكّ الذي ظهرت به آخر مرة).
  final String? placeholderUrl;

  /// لون إطار الصورة — ثابت لا يتبع العالم ولا السطوع.
  static const Color wellColor = Colors.white;

  /// علامة التحميل فوق [wellColor]: خط العالم الفاصل في الفاتح، ورمادي فاتح في الليلي
  /// (الخط الفاصل الليلي داكن فيظهر بقعة على الأبيض).
  static Color markColor(WorldThemePalette t) =>
      t.isDark ? Color.lerp(wellColor, t.canvas, 0.12)! : t.hairline;

  const ProductCoverImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.filterQuality = FilterQuality.medium,
    this.decodeWidth,
    this.placeholderUrl,
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

        final fallback = Center(
          child: Image.asset(
            _fallbackAsset,
            width: (w != null && w > 48) ? w * 0.45 : 48,
            height: (h != null && h > 48) ? h * 0.45 : 48,
            cacheWidth: _fallbackCacheWidth,
            fit: BoxFit.contain,
          ),
        );

        final resolvedUrl = resolveMediaUrl(url);
        if (resolvedUrl.isEmpty) {
          return SizedBox(
            width: w,
            height: h,
            child: ColoredBox(color: wellColor, child: fallback),
          );
        }

        final pixelW = decodeWidth ?? cachePixelWidth(context, _decodeLogicalWidth(fit, w, h));
        _rememberDecode(resolvedUrl, pixelW);
        // علامة ثابتة بلون الخط الفاصل — لا مؤشرات دوّارة في كل بطاقة أثناء التمرير.
        final mark = ColoredBox(
          color: wellColor,
          child: Center(child: BrandMark(height: 26, color: markColor(context.worldTheme))),
        );
        final lowRes = _lowResPlaceholder(resolvedUrl, mark);

        return SizedBox(
          width: w,
          height: h,
          child: Stack(
            fit: StackFit.expand,
            children: [
              const ColoredBox(color: wellColor),
              _RetryingNetworkImage(
                url: mediaVariantFor(resolvedUrl, pixelW),
                originalUrl: resolvedUrl,
                memCacheWidth: pixelW,
                fit: fit,
                filterQuality: filterQuality,
                fadeInDuration: lowRes == null ? const Duration(milliseconds: 60) : Duration.zero,
                placeholder: (_) => lowRes ?? mark,
                error: (_) => fallback,
              ),
            ],
          ),
        );
      },
    );
  }

  /// [placeholderUrl] بالرابط وعرض الفكّ اللذين ظهر بهما آخر مرة — نفس مفتاح كاش الذاكرة.
  Widget? _lowResPlaceholder(String resolvedUrl, Widget mark) {
    final raw = placeholderUrl;
    if (raw == null || raw.isEmpty) return null;
    final lowUrl = resolveMediaUrl(raw);
    if (lowUrl.isEmpty || lowUrl == resolvedUrl) return null;
    final lowW = _lastDecodeWidths[lowUrl];
    return CachedNetworkImage(
      imageUrl: lowW == null ? lowUrl : mediaVariantFor(lowUrl, lowW),
      cacheManager: AppImageCacheManager.instance,
      fit: fit,
      filterQuality: filterQuality,
      fadeInDuration: Duration.zero,
      fadeOutDuration: Duration.zero,
      memCacheWidth: lowW ?? 320,
      placeholder: (_, __) => mark,
      errorWidget: (_, __, ___) => mark,
    );
  }
}

/// CachedNetworkImage مع:
/// - رجوع للرابط الأصلي إن فشل المقاس المختار (احتياط لملف لم يُولَّد على السيرفر)؛
/// - إعادة المحاولة عند النقر على صورة فشلت: يُحذف من الكاش ويُعاد البناء.
///   النقر يُلتقط بـ Listener لا GestureDetector حتى لا يسرق نقرة البطاقة الأم
///   (النقر على بطاقة صورتها معطوبة يفتحها ويعيد تحميل الصورة معاً).
class _RetryingNetworkImage extends StatefulWidget {
  final String url;
  final String originalUrl;
  final int memCacheWidth;
  final double? width;
  final double? height;
  final BoxFit fit;
  final FilterQuality filterQuality;
  final Duration fadeInDuration;
  final WidgetBuilder placeholder;
  final WidgetBuilder error;

  const _RetryingNetworkImage({
    required this.url,
    required this.originalUrl,
    required this.memCacheWidth,
    this.width,
    this.height,
    required this.fit,
    required this.filterQuality,
    required this.fadeInDuration,
    required this.placeholder,
    required this.error,
  });

  @override
  State<_RetryingNetworkImage> createState() => _RetryingNetworkImageState();
}

class _RetryingNetworkImageState extends State<_RetryingNetworkImage> {
  int _attempt = 0;
  Offset? _downAt;
  DateTime? _lastRetry;

  /// نقرة فعلية فقط (لا رفع إصبع بعد سحب للتمرير)، ومرة كل ثانيتين على الأكثر.
  void _onPointerUp(PointerUpEvent e) {
    final down = _downAt;
    _downAt = null;
    if (down == null || (e.position - down).distance > kTouchSlop) return;
    final now = DateTime.now();
    if (_lastRetry != null && now.difference(_lastRetry!) < const Duration(seconds: 2)) return;
    _lastRetry = now;
    _retry();
  }

  Future<void> _retry() async {
    final manager = AppImageCacheManager.instance;
    try {
      await CachedNetworkImage.evictFromCache(widget.url, cacheManager: manager);
      if (widget.originalUrl != widget.url) {
        await CachedNetworkImage.evictFromCache(widget.originalUrl, cacheManager: manager);
      }
    } catch (_) {}
    if (mounted) setState(() => _attempt++);
  }

  Widget _net(String url, Widget Function(BuildContext) onError) => CachedNetworkImage(
        // المفتاح يتغيّر مع إعادة المحاولة فقط — لا مع الرابط، حتى يبقى useOldImageOnUrlChange فعّالاً.
        key: ValueKey(_attempt),
        imageUrl: url,
        cacheManager: AppImageCacheManager.instance,
        width: widget.width,
        height: widget.height,
        fit: widget.fit,
        filterQuality: widget.filterQuality,
        fadeInDuration: widget.fadeInDuration,
        fadeOutDuration: Duration.zero,
        useOldImageOnUrlChange: true,
        memCacheWidth: widget.memCacheWidth,
        placeholder: (context, _) => widget.placeholder(context),
        errorWidget: (context, _, __) => onError(context),
      );

  Widget _failed(BuildContext context) => Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (e) => _downAt = e.position,
        onPointerCancel: (_) => _downAt = null,
        onPointerUp: _onPointerUp,
        child: widget.error(context),
      );

  @override
  Widget build(BuildContext context) {
    if (widget.url == widget.originalUrl) return _net(widget.url, _failed);
    return _net(widget.url, (_) => _net(widget.originalUrl, _failed));
  }
}
