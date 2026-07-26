import 'dart:math' as math;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../../core/cache/image_cache.dart';
import '../../../core/widgets/shimmer_box.dart';
import '../../../data/models/category.dart';
import 'categories_theme.dart';

/// صورة أو أيقونة القسم — مع shimmer وظهور تدريجي.
class CategoryLineArt extends StatelessWidget {
  final Category category;
  final double size;
  final bool alignCorner;
  final bool expand;

  const CategoryLineArt({
    super.key,
    required this.category,
    this.size = 72,
    this.alignCorner = false,
    this.expand = false,
  });

  static const _palette = <Color>[
    Color(0xFFE53935),
    Color(0xFF43A047),
    Color(0xFF1E88E5),
    Color(0xFF8E24AA),
    Color(0xFFFB8C00),
    Color(0xFF00897B),
    Color(0xFF6D4C41),
    Color(0xFF546E7A),
  ];

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
    if (expand) {
      return LayoutBuilder(
        builder: (context, constraints) {
          final maxW = constraints.maxWidth;
          final maxH = constraints.maxHeight;
          if (maxW <= 0 || maxH <= 0) return const SizedBox.shrink();

          final artSize = alignCorner
              ? math.min(
                  maxW * CategoriesTheme.iconScale,
                  maxH * CategoriesTheme.iconHeightScale,
                )
              : math.min(maxW, maxH) * CategoriesTheme.iconScale;
          final alignment =
              alignCorner ? AlignmentDirectional.bottomEnd : Alignment.center;

          return ClipRect(
            child: SizedBox(
              width: maxW,
              height: maxH,
              child: Align(
                alignment: alignment,
                child: Padding(
                  padding: EdgeInsetsDirectional.only(
                    end: alignCorner ? 2 : 0,
                    bottom: alignCorner ? 2 : 0,
                  ),
                  child: SizedBox(
                    width: artSize,
                    height: artSize,
                    child: _ArtBody(
                      category: category,
                      size: artSize,
                      alignCorner: false,
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      );
    }

    return SizedBox(
      width: size,
      height: size,
      child: _ArtBody(category: category, size: size, alignCorner: alignCorner),
    );
  }
}

class _ArtBody extends StatelessWidget {
  final Category category;
  final double size;
  final bool alignCorner;

  const _ArtBody({
    required this.category,
    required this.size,
    required this.alignCorner,
  });

  @override
  Widget build(BuildContext context) {
    final corner = alignCorner ? AlignmentDirectional.bottomEnd : Alignment.center;

    if (category.imageUrl.isNotEmpty) {
      final pixelW = cachePixelWidth(context, size);
      return Align(
        alignment: corner,
        child: CachedNetworkImage(
          imageUrl: category.imageUrl,
          cacheManager: AppImageCacheManager.instance,
          width: size,
          height: size,
          fit: BoxFit.contain,
          fadeInDuration: Duration.zero,
          fadeOutDuration: Duration.zero,
          memCacheWidth: pixelW,
          filterQuality: FilterQuality.medium,
          placeholder: (_, __) => ShimmerBox(width: size, height: size, radius: 4),
          errorWidget: (_, __, ___) => _fallbackIcon(context),
        ),
      );
    }

    final emoji = category.icon?.trim();
    if (emoji != null && emoji.isNotEmpty && emoji.runes.length <= 2) {
      return Align(
        alignment: corner,
        child: Text(
          emoji,
          style: TextStyle(fontSize: size * 0.58, height: 1),
        ),
      );
    }

    final spec = _resolve(category);
    return Align(
      alignment: corner,
      child: Icon(
        spec.icon,
        size: size * 0.82,
        color: spec.color,
      ),
    );
  }

  Widget _fallbackIcon(BuildContext context) {
    final spec = _resolve(category);
    return Icon(
      spec.icon,
      size: size * 0.72,
      color: spec.color.withValues(alpha: 0.55),
    );
  }

  _ArtSpec _resolve(Category category) {
    final key =
        '${category.slug} ${category.name} ${category.nameEn ?? ''} ${category.nameAr ?? ''}'.toLowerCase();

    IconData icon;
    Color? color;

    if (_has(key, 'makeup', 'مكياج', 'ميك')) {
      icon = Icons.brush_outlined;
      color = const Color(0xFFE53935);
    } else if (_has(key, 'skin', 'بشرة', 'عناية', 'skincare')) {
      icon = Icons.spa_outlined;
      color = const Color(0xFF43A047);
    } else if (_has(key, 'hair', 'شعر')) {
      icon = Icons.content_cut_outlined;
      color = const Color(0xFF1E88E5);
    } else if (_has(key, 'fragrance', 'عطر', 'perfume', 'روائح')) {
      icon = Icons.air_outlined;
      color = const Color(0xFF1E88E5);
    } else if (_has(key, 'bath', 'حمام', 'body', 'جسم')) {
      icon = Icons.water_drop_outlined;
      color = const Color(0xFF00897B);
    } else if (_has(key, 'tool', 'أداة', 'tools', 'فرش')) {
      icon = Icons.face_retouching_natural_outlined;
      color = const Color(0xFF8E24AA);
    } else if (_has(key, 'offer', 'عرض', 'sale', 'تخفيض')) {
      icon = Icons.local_offer_outlined;
      color = const Color(0xFFE53935);
    } else if (_has(key, 'new', 'جديد')) {
      icon = Icons.auto_awesome_outlined;
      color = const Color(0xFFE53935);
    } else if (_has(key, 'gift', 'هدية', 'مجموعة')) {
      icon = Icons.card_giftcard_outlined;
      color = const Color(0xFFFB8C00);
    } else {
      final h = category.id.hashCode.abs();
      icon = CategoryLineArt._icons[h % CategoryLineArt._icons.length];
      color = CategoryLineArt._palette[h % CategoryLineArt._palette.length];
    }

    return _ArtSpec(icon: icon, color: color!);
  }

  bool _has(String key, String a, String b, [String? c, String? d]) {
    if (key.contains(a) || key.contains(b)) return true;
    if (c != null && key.contains(c)) return true;
    if (d != null && key.contains(d)) return true;
    return false;
  }
}

class _ArtSpec {
  final IconData icon;
  final Color color;
  const _ArtSpec({required this.icon, required this.color});
}
