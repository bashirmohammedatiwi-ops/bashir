import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import 'home_theme.dart';
import 'photo_shape_kit.dart';

/// إطار بسيط موحّد لبطاقات المعرض.
abstract final class GalleryFrame {
  static const borderWidth = 1.0;

  static BoxDecoration decoration({
    required BorderRadius? radius,
    bool circle = false,
  }) =>
      BoxDecoration(
        color: Colors.white,
        shape: circle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: circle ? null : radius,
        border: Border.all(
          color: AppColors.hairline.withValues(alpha: 0.9),
          width: borderWidth,
        ),
      );
}

bool _isRtl(BuildContext context) =>
    Directionality.of(context) == TextDirection.rtl;

/// بطاقة صورة نظيفة — بدون ظلال، قص أنيق، نص أسفل الصورة.
class GalleryPhotoCard extends StatelessWidget {
  final PhotoTileData data;
  final double width;
  final double height;
  final BoxFit fit;
  final VoidCallback? onTap;
  final bool showCaption;

  const GalleryPhotoCard({
    super.key,
    required this.data,
    required this.width,
    required this.height,
    this.fit = BoxFit.cover,
    this.onTap,
    this.showCaption = true,
  });

  bool get _hasCaption =>
      (data.title?.isNotEmpty ?? false) || (data.subtitle?.isNotEmpty ?? false);

  @override
  Widget build(BuildContext context) {
    if (data.imageUrl.isEmpty) return const SizedBox.shrink();

    final shape = data.shape;
    final radius = PhotoShapeGeometry.cornerRadius(shape, height);
    final borderRadius = PhotoShapeGeometry.borderRadius(shape, radius);

    Widget image = AppNetworkImage(
      url: data.imageUrl,
      fit: fit,
      width: width,
      height: height,
      backgroundColor: HomeTheme.pearl,
    );

    if (data.badge?.isNotEmpty ?? false) {
      image = Stack(
        fit: StackFit.expand,
        children: [
          image,
          PositionedDirectional(
            top: 8,
            end: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: HomeTheme.accent,
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                data.badge!,
                style: HomeTheme.overline.copyWith(color: Colors.white, fontSize: 9),
              ),
            ),
          ),
        ],
      );
    }

    image = PhotoShapeGeometry.shapedClip(
      child: image,
      shape: shape,
      radius: borderRadius,
    );

    final framedImage = Container(
      width: width,
      height: height,
      decoration: GalleryFrame.decoration(
        radius: shape == 'circle' ? null : borderRadius,
        circle: shape == 'circle',
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
  final String defaultShape;
  final String? defaultAspect;
  final String defaultSize;
  final double gap;
  final bool autoSpan;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryBentoLayout({
    super.key,
    required this.items,
    required this.defaultShape,
    required this.defaultAspect,
    required this.defaultSize,
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
        final isRtl = _isRtl(context);

        return SizedBox(
          height: totalH,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              for (final tile in tiles)
                PositionedDirectional(
                  start: isRtl ? maxW - tile.left - tile.width : tile.left,
                  top: tile.top,
                  width: tile.width,
                  height: tile.height,
                  child: GalleryPhotoCard(
                    data: tile.data,
                    width: tile.width,
                    height: tile.height,
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

  PhotoTileData _parse(Map<String, dynamic> raw) {
    return PhotoTileData.fromMap(
      raw,
      defaultShape: defaultShape,
      defaultAspect: defaultAspect,
      galleryMode: true,
    );
  }

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
  final String defaultShape;
  final String? defaultSize;
  final double? defaultAspect;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryHorizontalLayout({
    super.key,
    required this.items,
    required this.height,
    required this.gap,
    required this.defaultShape,
    required this.defaultSize,
    required this.defaultAspect,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height + 28,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.zero,
        itemCount: items.length,
        separatorBuilder: (_, __) => SizedBox(width: gap),
        itemBuilder: (_, i) {
          final raw = items[i];
          final data = PhotoTileData.fromMap(
            raw,
            defaultShape: defaultShape,
            defaultAspect: defaultAspect?.toString(),
            galleryMode: true,
          );
          if (data.imageUrl.isEmpty) return const SizedBox.shrink();

          final w = PhotoShapeGeometry.tileWidth(
            height: height,
            shape: data.shape,
            size: defaultSize,
            data: data,
            defaultAspect: defaultAspect,
          );

          return GalleryPhotoCard(
            data: data,
            width: w,
            height: height,
            onTap: () => onTap(raw),
          );
        },
      ),
    );
  }
}

/// شبكة منتظمة نظيفة — عمودان.
class GalleryGridLayout extends StatelessWidget {
  final List<Map<String, dynamic>> items;
  final int columns;
  final double gap;
  final String defaultShape;
  final double? defaultAspect;
  final void Function(Map<String, dynamic> raw) onTap;

  const GalleryGridLayout({
    super.key,
    required this.items,
    this.columns = 2,
    required this.gap,
    required this.defaultShape,
    required this.defaultAspect,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final aspect = defaultAspect ?? PhotoShapeGeometry.aspectForShape(defaultShape);

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
                  final data = PhotoTileData.fromMap(
                    raw,
                    defaultShape: defaultShape,
                    defaultAspect: defaultAspect?.toString(),
                    galleryMode: true,
                  );
                  if (data.imageUrl.isEmpty) return const SizedBox.shrink();
                  return GalleryPhotoCard(
                    data: data,
                    width: tileW,
                    height: tileH,
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
