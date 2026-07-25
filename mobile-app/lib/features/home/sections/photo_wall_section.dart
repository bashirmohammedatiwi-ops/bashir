import 'package:flutter/material.dart';

import '../home_link.dart';
import '../widgets/gallery_photo_card.dart';
import '../widgets/home_image_marquee.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';
import '../widgets/photo_shape_kit.dart';
import '../../../data/models/home_section.dart';

/// معرض صور متقدم — بطاقات أنيقة بأحجام وأشكال متنوعة، بدون ظلال.
class PhotoWallSection extends StatelessWidget {
  final HomeSection section;
  const PhotoWallSection({super.key, required this.section});

  bool get _isAdvanced => section.type == 'PHOTO_WALL' || section.type == 'IMAGE_COLLAGE';

  @override
  Widget build(BuildContext context) {
    final items = section.items.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    if (items.isEmpty) return const SizedBox.shrink();

    final display = _resolveDisplay(section.display ?? section.layout);
    final defaultShape = section.shape ?? 'rounded';
    final defaultSize = section.cardSize ?? 'md';
    final defaultAspect = section.bannerAspect;
    final height = section.imageHeight ?? PhotoShapeGeometry.sizeHeight(defaultSize);
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
          'marquee' => _marquee(context, items, height, gap, defaultShape, defaultSize, defaultAspect, onTap),
          'grid' => GalleryGridLayout(
              items: items,
              gap: gap,
              defaultShape: defaultShape,
              defaultAspect: defaultAspect,
              columns: (int.tryParse(section.sectionLayout ?? '') ?? 2).clamp(2, 3),
              onTap: onTap,
            ),
          'stack' => _stack(items, gap, defaultShape, defaultAspect, onTap),
          'scroll' => GalleryHorizontalLayout(
              items: items,
              height: height,
              gap: gap,
              defaultShape: defaultShape,
              defaultSize: defaultSize,
              defaultAspect: defaultAspect,
              onTap: onTap,
            ),
          'bento' || 'mosaic' => GalleryBentoLayout(
              items: items,
              gap: gap,
              defaultShape: defaultShape,
              defaultAspect: defaultAspect?.toString(),
              defaultSize: defaultSize,
              autoSpan: display == 'mosaic' || _isAdvanced,
              onTap: onTap,
            ),
          _ => GalleryBentoLayout(
              items: items,
              gap: gap,
              defaultShape: defaultShape,
              defaultAspect: defaultAspect?.toString(),
              defaultSize: defaultSize,
              autoSpan: _isAdvanced,
              onTap: onTap,
            ),
        },
      ),
    );
  }

  /// تحويل أوضاع العرض القديمة إلى تخطيط بطاقات أنيق.
  String _resolveDisplay(String? raw) {
    final d = raw?.trim().toLowerCase() ?? '';
    if (_isAdvanced) {
      return switch (d) {
        'marquee' => 'marquee',
        'grid' => 'grid',
        'stack' => 'stack',
        'scroll' => 'scroll',
        'bento' || 'mosaic' => d,
        // carousel / stagger / افتراضي → bento
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
    String defaultShape,
    String defaultSize,
    double? defaultAspect,
    void Function(Map<String, dynamic>) onTap,
  ) {
    final images = <HomeMarqueeImage>[];
    for (final raw in items) {
      final data = PhotoTileData.fromMap(
        raw,
        defaultShape: defaultShape,
        galleryMode: true,
      );
      if (data.imageUrl.isEmpty) continue;
      final w = PhotoShapeGeometry.tileWidth(
        height: height,
        shape: data.shape,
        size: defaultSize,
        data: data,
        defaultAspect: defaultAspect,
      );
      images.add(
        HomeMarqueeImage(
          url: data.imageUrl,
          width: w,
          height: height,
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
    );
  }

  Widget _stack(
    List<Map<String, dynamic>> items,
    double gap,
    String defaultShape,
    double? defaultAspect,
    void Function(Map<String, dynamic>) onTap,
  ) {
    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) SizedBox(height: gap),
          LayoutBuilder(
            builder: (context, constraints) {
              final data = PhotoTileData.fromMap(
                items[i],
                defaultShape: defaultShape,
                defaultAspect: defaultAspect?.toString(),
                galleryMode: true,
              );
              if (data.imageUrl.isEmpty) return const SizedBox.shrink();
              final aspect = PhotoShapeGeometry.parseAspect(data.aspectRatio) ??
                  defaultAspect ??
                  PhotoShapeGeometry.aspectForShape(data.shape);
              final h = constraints.maxWidth / aspect;
              return GalleryPhotoCard(
                data: data,
                width: constraints.maxWidth,
                height: h.clamp(120, 280),
                onTap: () => onTap(items[i]),
              );
            },
          ),
        ],
      ],
    );
  }
}
