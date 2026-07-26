import 'dart:math' as math;

import '../../../data/models/home_section.dart';
import 'photo_shape_kit.dart';

/// حساب أبعاد البلاطات بشكل متجاوب حسب عرض الشاشة.
class GalleryTileSizer {
  final double viewportWidth;
  final double gap;
  final double tilesPerView;
  final int? gridColumns;
  final String rowHeight;
  final double aspectRatio;

  const GalleryTileSizer({
    required this.viewportWidth,
    required this.gap,
    required this.tilesPerView,
    required this.rowHeight,
    required this.aspectRatio,
    this.gridColumns,
  });

  factory GalleryTileSizer.forSection({
    required double viewportWidth,
    required double gap,
    required HomeSection section,
    required double aspectRatio,
    int? gridColumns,
  }) {
    return GalleryTileSizer(
      viewportWidth: viewportWidth,
      gap: gap,
      tilesPerView: resolveTilesPerView(section),
      gridColumns: gridColumns,
      rowHeight: section.rowHeight ?? 'auto',
      aspectRatio: aspectRatio,
    );
  }

  /// يميّز بين نسبة حقيقية (مثل 16×9) وأبعاد بكسل قديمة (مثل 380×120).
  static bool _isLegacyPixelPair(double w, double h) => w > 48 && h > 48;

  static String _displayOf(HomeSection section) =>
      (section.display ?? section.layout ?? section.sectionLayout ?? '').toLowerCase();

  static double resolveTilesPerView(HomeSection section) {
    if (section.tilesPerView != null && section.tilesPerView! > 0) {
      return section.tilesPerView!.clamp(1, 4);
    }

    final cw = section.customWidth;
    final ch = section.customHeight;
    if (cw != null && cw > 120 && (ch == null || _isLegacyPixelPair(cw, ch))) {
      if (cw >= 300) return 1;
      if (cw >= 220) return 1.5;
      if (cw >= 160) return 2;
    }

    return switch (_displayOf(section)) {
      'stack' => 1,
      'marquee' || 'carousel' => 2,
      _ => 2.5,
    };
  }

  static double resolveAspect(HomeSection section, {String? defaultAspect}) {
    if (section.aspectRatio == 'custom' &&
        section.customWidth != null &&
        section.customHeight != null &&
        section.customHeight! > 0) {
      return section.customWidth! / section.customHeight!;
    }

    return PhotoShapeGeometry.parseAspect(section.aspectRatio ?? defaultAspect) ??
        PhotoShapeGeometry.aspectForShape(section.shape ?? 'rounded');
  }

  double get tileWidth {
    if (gridColumns != null && gridColumns! > 0) {
      return (viewportWidth - gap * (gridColumns! - 1)) / gridColumns!;
    }
    final gapCount = math.max(0, tilesPerView.ceil() - 1);
    return (viewportWidth - gap * gapCount) / tilesPerView;
  }

  double get tileHeight {
    final preset = switch (rowHeight) {
      'compact' => 96.0,
      'normal' => 140.0,
      'tall' => 180.0,
      'xl' => 220.0,
      _ => null,
    };
    if (preset != null) return preset;

    // تلقائي — الارتفاع دائماً متناسق مع العرض والنسبة
    final fromAspect = tileWidth / aspectRatio;
    return fromAspect.clamp(72.0, 420.0);
  }
}
