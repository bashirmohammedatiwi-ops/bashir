import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/scroll_perf.dart';
import 'home_theme.dart';
import 'photo_shape_kit.dart';

/// إعدادات العرض المشتركة — من لوحة التحكم عبر API
class GalleryRenderStyle {
  final String defaultShape;
  final String? defaultAspect;
  final String defaultSize;
  final String defaultOverlay;
  final String defaultBorder;
  final bool defaultShadow;
  final BoxFit fit;
  final double? tileCornerRadius;
  final double? sectionCustomWidth;
  final double? sectionCustomHeight;

  const GalleryRenderStyle({
    this.defaultShape = 'rounded',
    this.defaultAspect,
    this.defaultSize = 'md',
    this.defaultOverlay = 'none',
    this.defaultBorder = 'none',
    this.defaultShadow = false,
    this.fit = BoxFit.cover,
    this.tileCornerRadius,
    this.sectionCustomWidth,
    this.sectionCustomHeight,
  });

  Map<String, dynamic> enrichRaw(Map<String, dynamic> raw) {
    final m = Map<String, dynamic>.from(raw);
    if (m['customWidth'] == null && sectionCustomWidth != null) {
      m['customWidth'] = sectionCustomWidth;
    }
    if (m['customHeight'] == null && sectionCustomHeight != null) {
      m['customHeight'] = sectionCustomHeight;
    }
    return m;
  }

  PhotoTileData tileData(Map<String, dynamic> raw) {
    return PhotoTileData.fromMap(
      enrichRaw(raw),
      defaultShape: defaultShape,
      defaultAspect: defaultAspect,
      defaultOverlay: defaultOverlay,
      defaultBorder: defaultBorder,
      defaultShadow: defaultShadow,
    );
  }

  String itemSize(Map<String, dynamic> raw) =>
      raw['size']?.toString().trim().isNotEmpty == true ? raw['size'].toString() : defaultSize;
}

/// بطاقة صورة نظيفة — قص أنيق، إطار، overlay، نص أسفل الصورة.
class GalleryPhotoCard extends StatelessWidget {
  final PhotoTileData data;
  final double width;
  final double height;
  final BoxFit fit;
  final VoidCallback? onTap;
  final bool showCaption;
  final double? cornerRadiusOverride;

  const GalleryPhotoCard({
    super.key,
    required this.data,
    required this.width,
    required this.height,
    this.fit = BoxFit.cover,
    this.onTap,
    this.showCaption = true,
    this.cornerRadiusOverride,
  });

  bool get _hasCaption =>
      (data.title?.isNotEmpty ?? false) || (data.subtitle?.isNotEmpty ?? false);

  @override
  Widget build(BuildContext context) {
    if (data.imageUrl.isEmpty) return const SizedBox.shrink();

    final shape = data.shape;
    final radius = PhotoShapeGeometry.cornerRadius(
      shape,
      height,
      override: cornerRadiusOverride,
    );
    final borderRadius = PhotoShapeGeometry.borderRadius(shape, radius);
    final border = PhotoShapeGeometry.border(data.borderStyle);

    Widget image = AppNetworkImage(
      url: data.imageUrl,
      fit: fit,
      width: width,
      height: height,
      backgroundColor: HomeTheme.pearl,
    );

    image = _GalleryOverlay(
      style: data.overlayStyle ?? 'none',
      title: data.title,
      subtitle: data.subtitle,
      badge: data.badge,
      child: image,
    );

    image = PhotoShapeGeometry.shapedClip(
      child: image,
      shape: shape,
      radius: borderRadius,
    );

    final framedImage = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: shape == 'circle' ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: shape == 'circle' ? null : borderRadius,
        border: border,
        boxShadow: data.showShadow
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: shape == 'circle' ? BorderRadius.zero : borderRadius,
        child: shape == 'circle'
            ? ClipOval(child: SizedBox(width: width, height: height, child: image))
            : SizedBox(width: width, height: height, child: image),
      ),
    );

    final card = SizedBox(
      width: width,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          framedImage,
          if (showCaption && _hasCaption) ...[
            const SizedBox(height: 6),
            if (data.title?.isNotEmpty ?? false)
              Text(
                data.title!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.chipLabel.copyWith(fontSize: 11.5, fontWeight: FontWeight.w700),
              ),
            if (data.subtitle?.isNotEmpty ?? false) ...[
              const SizedBox(height: 1),
              Text(
                data.subtitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: HomeTheme.body(size: 10.5, color: HomeTheme.inkMuted),
              ),
            ],
          ],
        ],
      ),
    );

    if (onTap == null) return card;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap!();
        },
        borderRadius: borderRadius,
        child: card,
      ),
    );
  }
}

/// تخطيط bento — بطاقات بأحجام وأشكال متنوعة.
class GalleryBentoLayout extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final GalleryRenderStyle style;
  final double gap;
  final bool autoSpan;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryBentoLayout({
    super.key,
    required this.items,
    required this.style,
    this.gap = 10,
    this.autoSpan = true,
    required this.onTap,
  });

  static const _cols = 4;
  static const _rowUnit = 76.0;

  static (int cols, int rows) _autoSpan(int index, String shape) {
    if (shape == 'circle' || shape == 'square') return (1, 1);
    return switch (index % 5) {
      0 => (2, 2),
      1 => (2, 1),
      2 => (1, 2),
      3 => (1, 1),
      _ => (2, 1),
    };
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxW = constraints.maxWidth;
        final cellW = (maxW - gap * (_cols - 1)) / _cols;
        final occupied = <String>{};
        final tiles = <_BentoPlaced>[];

        for (var i = 0; i < items.length; i++) {
          final raw = items[i];
          final data = _parse(raw);
          var spanC = data.spanCols.clamp(1, _cols);
          var spanR = data.spanRows.clamp(1, 3);
          if (autoSpan && spanC == 1 && spanR == 1) {
            final auto = _autoSpan(i, data.shape);
            spanC = auto.$1;
            spanR = auto.$2;
          }

          final slot = _findSlot(occupied, spanC, spanR);
          if (slot == null) continue;

          final left = slot.col * (cellW + gap);
          final top = slot.row * (_rowUnit + gap);
          final w = cellW * spanC + gap * (spanC - 1);
          final h = _rowUnit * spanR + gap * (spanR - 1);

          for (var r = 0; r < spanR; r++) {
            for (var c = 0; c < spanC; c++) {
              occupied.add('${slot.col + c},${slot.row + r}');
            }
          }

          tiles.add(
            _BentoPlaced(
              left: left,
              top: top,
              width: w,
              height: h,
              data: data,
              raw: raw,
            ),
          );
        }

        if (tiles.isEmpty) return const SizedBox.shrink();

        final totalH = tiles.map((t) => t.top + t.height).reduce((a, b) => a > b ? a : b);

        return SizedBox(
          height: totalH,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              for (final tile in tiles)
                PositionedDirectional(
                  start: tile.left,
                  top: tile.top,
                  width: tile.width,
                  height: tile.height,
                  child: GalleryPhotoCard(
                    data: tile.data,
                    width: tile.width,
                    height: tile.height,
                    fit: style.fit,
                    cornerRadiusOverride: style.tileCornerRadius,
                    showCaption: false,
                    onTap: () => onTap(tile.raw),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  PhotoTileData _parse(Map<String, dynamic> raw) => style.tileData(raw);

  _BentoSlot? _findSlot(Set<String> occupied, int spanC, int spanR) {
    for (var row = 0; row < 24; row++) {
      for (var col = 0; col <= _cols - spanC; col++) {
        if (_fits(occupied, col, row, spanC, spanR)) {
          return _BentoSlot(col, row);
        }
      }
    }
    return null;
  }

  bool _fits(Set<String> occupied, int col, int row, int spanC, int spanR) {
    for (var r = 0; r < spanR; r++) {
      for (var c = 0; c < spanC; c++) {
        if (occupied.contains('${col + c},${row + r}')) return false;
      }
    }
    return true;
  }
}

class _BentoSlot {
  final int col;
  final int row;
  const _BentoSlot(this.col, this.row);
}

class _BentoPlaced {
  final double left;
  final double top;
  final double width;
  final double height;
  final PhotoTileData data;
  final Map<String, dynamic> raw;

  const _BentoPlaced({
    required this.left,
    required this.top,
    required this.width,
    required this.height,
    required this.data,
    required this.raw,
  });
}

/// تمرير أفقي — بطاقات بعرض متغير حسب الشكل.
class GalleryHorizontalLayout extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final double height;
  final double gap;
  final GalleryRenderStyle style;
  final double? defaultAspect;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryHorizontalLayout({
    super.key,
    required this.items,
    required this.height,
    required this.gap,
    required this.style,
    required this.defaultAspect,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final direction = Directionality.of(context);

    return SizedBox(
      height: height + 28,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: AppScrollPerf.physics,
        child: Row(
          textDirection: direction,
          children: [
            for (var i = 0; i < items.length; i++) ...[
              if (i > 0) SizedBox(width: gap),
              Builder(
                builder: (context) {
                  final raw = items[i];
                  final data = style.tileData(raw);
                  if (data.imageUrl.isEmpty) return const SizedBox.shrink();

                  final tileH = data.customHeight ?? height;
                  final w = PhotoShapeGeometry.tileWidth(
                    height: tileH,
                    shape: data.shape,
                    size: style.itemSize(raw),
                    data: data,
                    defaultAspect: defaultAspect,
                  );

                  return GalleryPhotoCard(
                    data: data,
                    width: w,
                    height: tileH,
                    fit: style.fit,
                    cornerRadiusOverride: style.tileCornerRadius,
                    showCaption: (data.overlayStyle ?? 'none') == 'none',
                    onTap: () => onTap(raw),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// شبكة منتظمة نظيفة — عمودان.
class GalleryGridLayout extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final int columns;
  final double gap;
  final GalleryRenderStyle style;
  final double? defaultAspect;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryGridLayout({
    super.key,
    required this.items,
    this.columns = 2,
    required this.gap,
    required this.style,
    required this.defaultAspect,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final aspect = defaultAspect ?? PhotoShapeGeometry.aspectForShape(style.defaultShape);

    return LayoutBuilder(
      builder: (context, constraints) {
        final tileW = (constraints.maxWidth - gap * (columns - 1)) / columns;
        final tileH = tileW / aspect;

        return Wrap(
          spacing: gap,
          runSpacing: gap,
          textDirection: Directionality.of(context),
          children: [
            for (final raw in items)
              Builder(
                builder: (context) {
                  final data = style.tileData(raw);
                  if (data.imageUrl.isEmpty) return const SizedBox.shrink();
                  final h = data.customHeight ?? tileH;
                  final w = data.customWidth ?? tileW;
                  return GalleryPhotoCard(
                    data: data,
                    width: w,
                    height: h,
                    fit: style.fit,
                    cornerRadiusOverride: style.tileCornerRadius,
                    onTap: () => onTap(raw),
                  );
                },
              ),
          ],
        );
      },
    );
  }
}

class _GalleryOverlay extends StatelessWidget {
  final String style;
  final String? title;
  final String? subtitle;
  final String? badge;
  final Widget child;

  const _GalleryOverlay({
    required this.style,
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final hasText = (title?.isNotEmpty ?? false) || (subtitle?.isNotEmpty ?? false);
    final hasBadge = badge?.isNotEmpty ?? false;
    if (style == 'none' && !hasText && !hasBadge) return child;

    return Stack(
      fit: StackFit.expand,
      children: [
        child,
        if (style == 'gradient' || style == 'bottom' || hasText)
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: style == 'center' ? 0.35 : 0.05),
                    Colors.black.withValues(alpha: 0.72),
                  ],
                  stops: const [0.0, 0.45, 1.0],
                ),
              ),
            ),
          ),
        if (hasBadge)
          PositionedDirectional(
            top: 8,
            end: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: HomeTheme.accent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                badge!,
                style: HomeTheme.overline.copyWith(color: Colors.white, fontSize: 10),
              ),
            ),
          ),
        if (hasText && style != 'badge')
          PositionedDirectional(
            start: 12,
            end: 12,
            bottom: style == 'center' ? null : 12,
            top: style == 'center' ? 0 : null,
            child: style == 'center'
                ? Center(
                    child: _GalleryOverlayText(title: title, subtitle: subtitle, center: true),
                  )
                : _GalleryOverlayText(title: title, subtitle: subtitle),
          ),
      ],
    );
  }
}

class _GalleryOverlayText extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final bool center;

  const _GalleryOverlayText({this.title, this.subtitle, this.center = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: center ? CrossAxisAlignment.center : CrossAxisAlignment.start,
      children: [
        if (title != null && title!.isNotEmpty)
          Text(
            title!,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            textAlign: center ? TextAlign.center : TextAlign.start,
            style: HomeTheme.sectionTitle(size: 13).copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
        if (subtitle != null && subtitle!.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            subtitle!,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: center ? TextAlign.center : TextAlign.start,
            style: HomeTheme.body(size: 11, color: Colors.white.withValues(alpha: 0.9)),
          ),
        ],
      ],
    );
  }
}
