import 'package:flutter/material.dart';

import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/gallery_photo_card.dart';
import '../widgets/gallery_tile_sizer.dart';
import '../widgets/home_image_marquee.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

/// معرض صور — تصميم موحّد لكل الصور حسب إعدادات القسم من لوحة التحكم.
class PhotoWallSection extends StatelessWidget {
  final HomeSection section;
  const PhotoWallSection({super.key, required this.section});

  GalleryRenderStyle get _style => GalleryRenderStyle.fromSection(section);

  @override
  Widget build(BuildContext context) {
    final items = section.items.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    if (items.isEmpty) return const SizedBox.shrink();

    final style = _style;
    final display = _resolveDisplay(section.display ?? section.layout ?? section.sectionLayout);
    final gap = section.marqueeGap ?? HomeTheme.itemGap;
    final padH = section.fullBleed ? 0.0 : HomeTheme.paddingH;
    final columns = _columns(section);

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
          'marquee' => _marquee(items, gap, style, onTap),
          'grid' || 'bento' || 'mosaic' || 'stagger' => GalleryGridLayout(
              section: section,
              items: items,
              gap: gap,
              style: style,
              columns: columns,
              onTap: onTap,
            ),
          'stack' => GalleryStackLayout(
              section: section,
              items: items,
              gap: gap,
              style: style,
              onTap: onTap,
            ),
          'scroll' || 'carousel' => GalleryHorizontalLayout(
              section: section,
              items: items,
              gap: gap,
              style: style,
              onTap: onTap,
            ),
          _ => GalleryHorizontalLayout(
              section: section,
              items: items,
              gap: gap,
              style: style,
              onTap: onTap,
            ),
        },
      ),
    );
  }

  int _columns(HomeSection section) {
    final layout = (section.sectionLayout ?? section.layout ?? '').toLowerCase();
    if (layout == 'grid3' || layout == '3') return 3;
    final fromDisplay = int.tryParse(layout.replaceAll('grid', ''));
    if (fromDisplay != null && fromDisplay > 0) return fromDisplay.clamp(2, 3);
    return 2;
  }

  String _resolveDisplay(String? raw) {
    final d = raw?.trim().toLowerCase() ?? '';
    return switch (d) {
      'marquee' => 'marquee',
      'grid' || 'grid2' || 'grid3' => 'grid',
      'stack' => 'stack',
      'scroll' || 'carousel' => 'scroll',
      'bento' || 'mosaic' || 'stagger' => 'grid',
      _ => switch (section.type) {
          'IMAGE_MARQUEE' => 'marquee',
          'PHOTO_WALL' || 'IMAGE_COLLAGE' => 'grid',
          'IMAGE_TILES' => 'grid',
          _ => 'scroll',
        },
    };
  }

  Widget _marquee(
    List<Map<String, dynamic>> items,
    double gap,
    GalleryRenderStyle style,
    void Function(Map<String, dynamic>) onTap,
  ) {
    final shape = style.defaultShape;
    final radius = style.tileCornerRadius ?? HomeTheme.galleryRadius;

    return LayoutBuilder(
      builder: (context, constraints) {
        final sizer = GalleryTileSizer.forSection(
          viewportWidth: constraints.maxWidth,
          gap: gap,
          section: section,
          aspectRatio: GalleryTileSizer.resolveAspect(section, defaultAspect: style.defaultAspect),
        );
        final tileH = sizer.tileHeight;
        final tileW = sizer.tileWidth;

        final images = <HomeMarqueeImage>[];
        for (final raw in items) {
          final data = style.tileData(raw);
          if (data.imageUrl.isEmpty) continue;
          images.add(
            HomeMarqueeImage(
              url: data.imageUrl,
              width: tileW,
              height: tileH,
              shape: shape,
              onTap: () => onTap(raw),
            ),
          );
        }
        if (images.isEmpty) return const SizedBox.shrink();

        return HomeImageMarquee(
          images: images,
          height: tileH,
          speed: section.marqueeSpeed ?? 5,
          gap: gap,
          radius: radius,
          startFromEndInRtl: true,
        );
      },
    );
  }
}
