import 'dart:async';

import 'package:flutter/material.dart';

import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
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

    void onTap(Map<String, dynamic> raw) => openSectionItemLink(context, raw);

    return HomeSectionShell(
      section: section,
      wrapCard: false,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: padH),
        child: switch (display) {
          'marquee' => _marquee(items, gap, style),
          'mosaic' => _mosaic(items, gap, style, onTap),
          'grid' || 'bento' || 'stagger' => GalleryGridLayout(
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
          'pager' => _PhotoPager(section: section, items: items, style: style, onTap: onTap),
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
      'mosaic' => 'mosaic',
      'stack' => 'stack',
      'pager' || 'flip' => 'pager',
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

  Widget _mosaic(
    List<Map<String, dynamic>> items,
    double gap,
    GalleryRenderStyle style,
    void Function(Map<String, dynamic> raw) onTap,
  ) {
    if (items.isEmpty) return const SizedBox.shrink();
    final first = items.first;
    final rest = items.skip(1).toList();
    return Column(
      children: [
        GalleryStackLayout(section: section, items: [first], gap: gap, style: style, onTap: onTap),
        if (rest.isNotEmpty) ...[
          SizedBox(height: gap),
          GalleryGridLayout(section: section, items: rest, gap: gap, style: style, columns: 2, onTap: onTap),
        ],
      ],
    );
  }

  Widget _marquee(
    List<Map<String, dynamic>> items,
    double gap,
    GalleryRenderStyle style,
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
            HomeMarqueeImage.fromItem(
              url: data.imageUrl,
              width: tileW,
              height: tileH,
              shape: shape,
              raw: raw,
            ),
          );
        }
        if (images.isEmpty) return const SizedBox.shrink();

        return HomeImageMarquee(
          key: ValueKey(
            'marquee-${section.id}-${images.map((e) => '${e.url}:${e.linkSignature}').join('|')}',
          ),
          images: images,
          height: tileH,
          speed: section.marqueeSpeed ?? 5,
          gap: gap,
          radius: radius,
          startFromEndInRtl: true,
          reverse: section.motion == 'reverse',
        );
      },
    );
  }
}

class _PhotoPager extends StatefulWidget {
  final HomeSection section;
  final List<Map<String, dynamic>> items;
  final GalleryRenderStyle style;
  final void Function(Map<String, dynamic> raw) onTap;

  const _PhotoPager({
    required this.section,
    required this.items,
    required this.style,
    required this.onTap,
  });

  @override
  State<_PhotoPager> createState() => _PhotoPagerState();
}

class _PhotoPagerState extends State<_PhotoPager> {
  late final PageController _page;
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _page = PageController(viewportFraction: 0.9);
    _arm();
  }

  void _arm() {
    _timer?.cancel();
    final count = widget.items.length;
    if (count < 2) return;
    final seconds = (11 - (widget.section.marqueeSpeed ?? 4).clamp(1, 10)).clamp(3, 10);
    _timer = Timer.periodic(Duration(seconds: seconds.toInt()), (_) {
      if (!_page.hasClients) return;
      final next = (_index + 1) % count;
      _page.animateToPage(next, duration: const Duration(milliseconds: 560), curve: Curves.easeOutCubic);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _page.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final aspect = GalleryTileSizer.resolveAspect(widget.section, defaultAspect: widget.style.defaultAspect);
    return Column(
      children: [
        AspectRatio(
          aspectRatio: aspect <= 0 ? 16 / 9 : aspect,
          child: PageView.builder(
            controller: _page,
            itemCount: widget.items.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (_, i) {
              final raw = widget.items[i];
              final data = widget.style.tileData(raw);
              return LayoutBuilder(
                builder: (context, constraints) => GalleryPhotoCard(
                  data: data,
                  width: constraints.maxWidth,
                  height: constraints.maxHeight,
                  onTap: () => widget.onTap(raw),
                  showShadow: widget.section.showShadow,
                ),
              );
            },
          ),
        ),
        if (widget.items.length > 1) ...[
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              for (var i = 0; i < widget.items.length; i++)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  width: i == _index ? 16 : 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: i == _index ? t.accent : t.hairline.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
            ],
          ),
        ],
      ],
    );
  }
}
