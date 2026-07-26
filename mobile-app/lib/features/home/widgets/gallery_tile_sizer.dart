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
  final double? legacyImageHeight;

  const GalleryTileSizer({
    required this.viewportWidth,
    required this.gap,
    required this.tilesPerView,
    required this.rowHeight,
    required this.aspectRatio,
    this.gridColumns,
    this.legacyImageHeight,
  });

  factory GalleryTileSizer.forSection({
    required double viewportWidth,
    required double gap,
    required HomeSection section,
    required double aspectRatio,
    int? gridColumns,
  }) {
    final display = (section.display ?? section.layout ?? '').toLowerCase();
    var tilesPerView = section.tilesPerView ?? 2.5;
    if (display == 'stack') tilesPerView = 1;

    var aspect = aspectRatio;
    if (section.aspectRatio == 'custom' &&
        section.customWidth != null &&
        section.customHeight != null &&
        section.customHeight! > 0) {
      aspect = section.customWidth! / section.customHeight!;
    }

    final rowHeight = section.rowHeight ??
        (section.imageHeight != null ? 'legacy' : 'auto');

    return GalleryTileSizer(
      viewportWidth: viewportWidth,
      gap: gap,
      tilesPerView: tilesPerView,
      gridColumns: gridColumns,
      rowHeight: rowHeight,
      aspectRatio: aspect,
      legacyImageHeight: section.imageHeight,
    );
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
    final gaps = (tilesPerView.ceil() - 1).clamp(0, 10);
    return (viewportWidth - gap * gaps) / tilesPerView;
  }

  double get tileHeight {
    if (rowHeight == 'legacy' && legacyImageHeight != null) {
      return legacyImageHeight!.clamp(72.0, 420.0);
    }
    final h = switch (rowHeight) {
      'compact' => 96.0,
      'normal' => 140.0,
      'tall' => 180.0,
      'xl' => 220.0,
      'auto' => tileWidth / aspectRatio,
      _ => tileWidth / aspectRatio,
    };
    return h.clamp(72.0, 420.0);
  }
}
