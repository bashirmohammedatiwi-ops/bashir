import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/cache/image_cache.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../data/models/category.dart';
import '../../worlds/world_theme.dart';

/// صورة القسم، وإلا أيقونته بألوان العالم الحالي — مع shimmer أثناء التحميل.
///
/// [expand]: يملأ المساحة المتاحة كلها (بلاطات وغلاف وشريط الأقسام): الصورة
/// بالقص، أو أيقونة داكنة على أرضية فاتحة بلون العالم — بدل شعار المتجر المكرّر.
class CategoryLineArt extends StatelessWidget {
  final Category category;
  final double size;
  final bool expand;

  const CategoryLineArt({
    super.key,
    required this.category,
    this.size = 72,
    this.expand = false,
  });

  static const _icons = <IconData>[
    Icons.spa_outlined,
    Icons.brush_outlined,
    Icons.content_cut_outlined,
    Icons.air_outlined,
    Icons.favorite_border_rounded,
    Icons.shopping_bag_outlined,
    Icons.auto_awesome_outlined,
    Icons.water_drop_outlined,
    Icons.face_retouching_natural_outlined,
    Icons.local_offer_outlined,
  ];

  @override
  Widget build(BuildContext context) {
    if (!expand) {
      return SizedBox(
        width: size,
        height: size,
        child: _ArtBody(category: category, width: size, height: size, filled: false),
      );
    }
    return LayoutBuilder(
      builder: (context, c) {
        final w = c.hasBoundedWidth ? c.maxWidth : size;
        final h = c.hasBoundedHeight ? c.maxHeight : w;
        if (w <= 0 || h <= 0) return const SizedBox.shrink();
        return SizedBox(
          width: w,
          height: h,
          child: _ArtBody(category: category, width: w, height: h, filled: true),
        );
      },
    );
  }
}

class _ArtBody extends StatelessWidget {
  final Category category;
  final double width;
  final double height;

  /// أرضية فاتحة خلف الأيقونة تملأ الصندوق.
  final bool filled;

  const _ArtBody({
    required this.category,
    required this.width,
    required this.height,
    required this.filled,
  });

  double get _side => width < height ? width : height;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    if (category.imageUrl.isNotEmpty) {
      return CachedNetworkImage(
        imageUrl: category.imageUrl,
        cacheManager: AppImageCacheManager.instance,
        width: width,
        height: height,
        fit: BoxFit.cover,
        fadeInDuration: Duration.zero,
        fadeOutDuration: Duration.zero,
        // يُفكّ بحجم ظهوره الفعلي لا بنصف عرض الشاشة.
        memCacheWidth: cachePixelWidth(context, width),
        filterQuality: FilterQuality.medium,
        placeholder: (_, __) => ShimmerBox(width: width, height: height, radius: 4),
        errorWidget: (_, __, ___) => _glyph(t, faded: true),
      );
    }
    return _glyph(t);
  }

  Widget _glyph(WorldThemePalette t, {bool faded = false}) {
    final emoji = category.icon?.trim();
    final Widget mark;
    if (emoji != null && emoji.isNotEmpty && emoji.runes.length <= 2) {
      mark = Text(
        emoji,
        textScaler: TextScaler.noScaling,
        style: TextStyle(fontSize: _side * (filled ? 0.42 : 0.58), height: 1),
      );
    } else {
      mark = Icon(
        _iconFor(category),
        size: _side * (filled ? 0.46 : 0.82),
        color: faded ? t.accentDark.withValues(alpha: 0.55) : t.accentDark,
      );
    }
    if (!filled) return Center(child: mark);
    return ColoredBox(color: t.accentLight, child: Center(child: mark));
  }

  static IconData _iconFor(Category category) {
    final key =
        '${category.slug} ${category.name} ${category.nameEn ?? ''} ${category.nameAr ?? ''}'
            .toLowerCase();
    if (_has(key, ['makeup', 'مكياج', 'ميك'])) return Icons.brush_outlined;
    if (_has(key, ['skin', 'بشرة', 'عناية'])) return Icons.spa_outlined;
    if (_has(key, ['hair', 'شعر'])) return Icons.content_cut_outlined;
    if (_has(key, ['fragrance', 'عطر', 'perfume', 'روائح'])) return Icons.air_outlined;
    if (_has(key, ['bath', 'حمام', 'body', 'جسم'])) return Icons.water_drop_outlined;
    if (_has(key, ['tool', 'أداة', 'فرش'])) return Icons.face_retouching_natural_outlined;
    if (_has(key, ['offer', 'عرض', 'sale', 'تخفيض'])) return Icons.local_offer_outlined;
    if (_has(key, ['new', 'جديد'])) return Icons.auto_awesome_outlined;
    if (_has(key, ['gift', 'هدية', 'مجموعة'])) return Icons.card_giftcard_outlined;
    final h = category.id.hashCode.abs();
    return CategoryLineArt._icons[h % CategoryLineArt._icons.length];
  }

  static bool _has(String key, List<String> words) => words.any(key.contains);
}

/// صورة القسم بحجم معلوم (يُفكّ بحجم ظهوره)، وإلا رسمه بألوان العالم —
/// لا شعار المتجر المكرّر الذي كان يبدو صورة معطوبة.
class CategoryThumb extends StatelessWidget {
  final Category category;

  /// ضلع الصورة إن كان معروفاً؛ وإلا يُقاس الصندوق الفعلي.
  final double? size;
  final Color? background;

  const CategoryThumb({
    super.key,
    required this.category,
    this.size,
    this.background,
  });

  @override
  Widget build(BuildContext context) {
    final url = category.imageUrl;
    if (url.isEmpty) return CategoryLineArt(category: category, expand: true);
    if (size != null) {
      return AppNetworkImage(
        url: url,
        width: size,
        height: size,
        fit: BoxFit.cover,
        backgroundColor: background,
      );
    }
    return LayoutBuilder(
      builder: (_, c) => AppNetworkImage(
        url: url,
        width: c.hasBoundedWidth ? c.maxWidth : null,
        height: c.hasBoundedHeight ? c.maxHeight : null,
        fit: BoxFit.cover,
        backgroundColor: background,
      ),
    );
  }
}
