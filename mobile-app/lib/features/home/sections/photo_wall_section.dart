import 'package:flutter/material.dart';

import '../home_link.dart';
import '../widgets/gallery_photo_card.dart';
import '../widgets/home_image_marquee.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';
import '../widgets/photo_shape_kit.dart';
import '../../../data/models/home_section.dart';

/// معرض صور متقدم — إعدادات لوحة التحكم تُطبَّق مباشرة في التطبيق.
class PhotoWallSection extends StatelessWidget {
  final HomeSection section;
  const PhotoWallSection({super.key, required this.section});

  bool get _isAdvanced => section.type == 'PHOTO_WALL' || section.type == 'IMAGE_COLLAGE';

  GalleryRenderStyle get _style => GalleryRenderStyle(
        defaultShape: section.shape ?? 'rounded',
        defaultAspect: section.aspectRatio ??
            (section.bannerAspect != null ? _aspectLabel(section.bannerAspect!) : null),
        defaultSize: section.cardSize ?? 'md',
        defaultOverlay: section.overlayStyle ?? 'none',
        defaultBorder: section.borderStyle ?? 'none',
        defaultShadow: section.showShadow,
        fit: PhotoShapeGeometry.parseFit(section.kind),
        tileCornerRadius: section.tileCornerRadius,
        sectionCustomWidth: section.customWidth,
        sectionCustomHeight: section.customHeight,
      );

  String? _aspectLabel(double aspect) {
    if ((aspect - 1).abs() < 0.05) return '1:1';
    if ((aspect - 4 / 3).abs() < 0.05) return '4:3';
    if ((aspect - 3 / 4).abs() < 0.05) return '3:4';
    if ((aspect - 16 / 9).abs() < 0.05) return '16:9';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final items = section.items.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    if (items.isEmpty) return const SizedBox.shrink();

    final style = _style;
    final display = _resolveDisplay(section.display ?? section.layout);
    final defaultAspect = section.bannerAspect;
    final height = section.imageHeight ?? PhotoShapeGeometry.sizeHeight(style.defaultSize);
    final gap = section.marqueeGap ?? 10;
    final padH = section.fullBleed ? 0.0 : HomeTheme.paddingH;

    void onTap(Map<String, dynamic> raw) => openSectionLink(
          context,
          linkType: raw['linkType']?.toString(),
          linkValue: raw['linkValue']?.toString(),
          legacyLink: raw['link']?.toString(),
        );

    return HomeSectionShell(
      section: section,
      wrapCard: false,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: padH),
        child: switch (display) {
          'marquee' => _marquee(context, items, height, gap, style, defaultAspect, onTap),
          'grid' => GalleryGridLayout(
              items: items,
              gap: gap,
              style: style,
              defaultAspect: defaultAspect,
              columns: (int.tryParse(section.sectionLayout ?? '') ?? 2).clamp(2, 3),
              onTap: onTap,
            ),
          'stack' => _stack(items, gap, style, defaultAspect, onTap),
          'scroll' => GalleryHorizontalLayout(
              items: items,
              height: height,
              gap: gap,
              style: style,
              defaultAspect: defaultAspect,
              onTap: onTap,
            ),
          'bento' || 'mosaic' => GalleryBentoLayout(
              items: items,
              gap: gap,
              style: style,
              autoSpan: display == 'mosaic' || _isAdvanced,
              onTap: onTap,
            ),
          _ => GalleryBentoLayout(
              items: items,
              gap: gap,
              style: style,
              autoSpan: _isAdvanced,
              onTap: onTap,
            ),
        },
      ),
    );
  }

  String _resolveDisplay(String? raw) {
    final d = raw?.trim().toLowerCase() ?? '';
    if (_isAdvanced) {
      return switch (d) {
        'marquee' => 'marquee',
        'grid' => 'grid',
        'stack' => 'stack',
        'scroll' => 'scroll',
        'bento' || 'mosaic' => d,
        _ => 'bento',
      };
    }
    return d.isEmpty ? 'scroll' : d;
  }

  Widget _marquee(
    BuildContext context,
    List<Map<String, dynamic>> items,
    double height,
    double gap,
    GalleryRenderStyle style,
    double? defaultAspect,
    void Function(Map<String, dynamic>) onTap,
  ) {
    final images = <HomeMarqueeImage>[];
    for (final raw in items) {
      final data = style.tileData(raw);
      if (data.imageUrl.isEmpty) continue;
      final tileH = data.customHeight ?? height;
      final w = PhotoShapeGeometry.tileWidth(
        height: tileH,
        shape: data.shape,
        size: style.itemSize(raw),
        data: data,
        defaultAspect: defaultAspect,
      );
      images.add(
        HomeMarqueeImage(
          url: data.imageUrl,
          width: w,
          height: tileH,
          shape: data.shape,
          onTap: () => onTap(raw),
        ),
      );
    }
    if (images.isEmpty) return const SizedBox.shrink();
    return HomeImageMarquee(
      images: images,
      height: height,
      speed: section.marqueeSpeed ?? 5,
      gap: gap,
      startFromEndInRtl: true,
    );
  }

  Widget _stack(
    List<Map<String, dynamic>> items,
    double gap,
    GalleryRenderStyle style,
    double? defaultAspect,
    void Function(Map<String, dynamic>) onTap,
  ) {
    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) SizedBox(height: gap),
          LayoutBuilder(
            builder: (context, constraints) {
              final data = style.tileData(items[i]);
              if (data.imageUrl.isEmpty) return const SizedBox.shrink();
              final aspect = PhotoShapeGeometry.parseAspect(data.aspectRatio) ??
                  defaultAspect ??
                  PhotoShapeGeometry.aspectForShape(data.shape);
              final h = data.customHeight ?? (constraints.maxWidth / aspect);
              return GalleryPhotoCard(
                data: data,
                width: data.customWidth ?? constraints.maxWidth,
                height: h.clamp(120, 480),
                fit: style.fit,
                cornerRadiusOverride: style.tileCornerRadius,
                onTap: () => onTap(items[i]),
              );
            },
          ),
        ],
      ],
    );
  }
}
