import 'package:flutter/material.dart';

import '../home_link.dart';
import '../widgets/home_image_marquee.dart';
import '../widgets/home_scroll_perf.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';
import '../widgets/photo_shape_kit.dart';
import '../../../data/models/home_section.dart';

/// معرض صور متقدم — MEDIA_GALLERY · PHOTO_WALL · IMAGE_COLLAGE
class PhotoWallSection extends StatelessWidget {
  final HomeSection section;
  const PhotoWallSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final items = section.items.whereType<Map>().toList();
    if (items.isEmpty) return const SizedBox.shrink();

    final display = section.display ?? section.layout ?? 'scroll';
    final defaultShape = section.shape ?? 'rounded';
    final defaultSize = section.cardSize ?? 'md';
    final defaultAspect = section.bannerAspect;
    final height = section.imageHeight ?? PhotoShapeGeometry.sizeHeight(defaultSize);
    final gap = section.marqueeGap ?? 12;
    final fit = PhotoShapeGeometry.parseFit(section.kind);
    final padH = section.fullBleed ? 0.0 : HomeTheme.paddingH;

    return HomeSectionShell(
      section: section,
      wrapCard: display != 'stack' && !section.fullBleed,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: padH),
        child: switch (display) {
          'marquee' => _marquee(context, items, height, gap, defaultShape, defaultSize, defaultAspect, fit),
          'carousel' => _carousel(context, items, height, gap, defaultShape, defaultSize, defaultAspect, fit),
          'grid' => _grid(context, items, height, gap, defaultShape, defaultSize, defaultAspect, fit, regular: true),
          'bento' || 'mosaic' => _grid(context, items, height, gap, defaultShape, defaultSize, defaultAspect, fit, regular: false),
          'stagger' => _stagger(context, items, height, gap, defaultShape, defaultSize, defaultAspect, fit),
          'stack' => _stack(context, items, defaultShape, defaultAspect, fit),
          _ => _scroll(context, items, height, gap, defaultShape, defaultSize, defaultAspect, fit),
        },
      ),
    );
  }

  PhotoTileData _data(Map raw, String defaultShape, String? defaultAspect, {String overlay = 'none'}) {
    return PhotoTileData.fromMap(
      Map<String, dynamic>.from(raw),
      defaultShape: defaultShape,
      defaultAspect: defaultAspect?.toString(),
      defaultOverlay: overlay,
      defaultShadow: true,
    );
  }

  Widget _buildTile(
    BuildContext context,
    Map raw,
    double height,
    String defaultShape,
    String? defaultSize,
    double? defaultAspect,
    BoxFit fit, {
    bool expand = false,
  }) {
    final data = _data(raw, defaultShape, defaultAspect?.toString());
    final aspect = PhotoShapeGeometry.parseAspect(data.aspectRatio) ??
        defaultAspect ??
        (expand ? PhotoShapeGeometry.aspectForShape(data.shape) : null);
    final w = expand
        ? null
        : PhotoShapeGeometry.tileWidth(
            height: height,
            shape: data.shape,
            size: defaultSize,
            data: data,
            defaultAspect: defaultAspect,
          );

    return PhotoTile(
      data: data,
      width: w,
      height: height,
      fit: fit,
      expand: expand,
      aspectRatio: aspect,
      onTap: () => openSectionLink(
        context,
        linkType: raw['linkType']?.toString(),
        linkValue: raw['linkValue']?.toString(),
        legacyLink: raw['link']?.toString(),
      ),
    );
  }

  Widget _scroll(
    BuildContext context,
    List<Map> items,
    double height,
    double gap,
    String defaultShape,
    String defaultSize,
    double? defaultAspect,
    BoxFit fit,
  ) {
    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        cacheExtent: HomeScrollPerf.horizontalCacheExtent,
        addAutomaticKeepAlives: false,
        itemCount: items.length,
        separatorBuilder: (_, __) => SizedBox(width: gap),
        itemBuilder: (_, i) => _buildTile(
          context,
          items[i],
          height,
          defaultShape,
          defaultSize,
          defaultAspect,
          fit,
        ),
      ),
    );
  }

  Widget _carousel(
    BuildContext context,
    List<Map> items,
    double height,
    double gap,
    String defaultShape,
    String defaultSize,
    double? defaultAspect,
    BoxFit fit,
  ) {
    return SizedBox(
      height: height,
      child: PageView.builder(
        controller: PageController(viewportFraction: 0.86),
        padEnds: false,
        itemCount: items.length,
        itemBuilder: (_, i) => Padding(
          padding: EdgeInsets.only(right: gap),
          child: _buildTile(
            context,
            items[i],
            height,
            defaultShape,
            defaultSize,
            defaultAspect,
            fit,
            expand: true,
          ),
        ),
      ),
    );
  }

  Widget _marquee(
    BuildContext context,
    List<Map> items,
    double height,
    double gap,
    String defaultShape,
    String defaultSize,
    double? defaultAspect,
    BoxFit fit,
  ) {
    final images = <HomeMarqueeImage>[];
    for (final raw in items) {
      final data = _data(raw, defaultShape, defaultAspect?.toString());
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
          onTap: () => openSectionLink(
            context,
            linkType: raw['linkType']?.toString(),
            linkValue: raw['linkValue']?.toString(),
            legacyLink: raw['link']?.toString(),
          ),
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

  Widget _grid(
    BuildContext context,
    List<Map> items,
    double height,
    double gap,
    String defaultShape,
    String defaultSize,
    double? defaultAspect,
    BoxFit fit, {
    required bool regular,
  }) {
    final cols = int.tryParse(section.sectionLayout ?? '') ?? (regular ? 3 : 4);
    if (!regular) {
      return _bentoGrid(context, items, cols, gap, defaultShape, defaultSize, defaultAspect, fit, height);
    }
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: cols.clamp(2, 6),
        mainAxisSpacing: gap,
        crossAxisSpacing: gap,
        childAspectRatio: defaultAspect ?? PhotoShapeGeometry.aspectForShape(defaultShape),
      ),
      itemCount: items.length,
      itemBuilder: (_, i) => _buildTile(
        context,
        items[i],
        height,
        defaultShape,
        defaultSize,
        defaultAspect,
        fit,
        expand: true,
      ),
    );
  }

  Widget _bentoGrid(
    BuildContext context,
    List<Map> items,
    int cols,
    double gap,
    String defaultShape,
    String defaultSize,
    double? defaultAspect,
    BoxFit fit,
    double rowHeight,
  ) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final cellW = (constraints.maxWidth - gap * (cols - 1)) / cols;
        final aspect = defaultAspect ?? PhotoShapeGeometry.aspectForShape(defaultShape);
        final cellH = cellW / aspect;
        return Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [
            for (final raw in items)
              _bentoTile(
                context,
                raw,
                cellW,
                cellH,
                gap,
                defaultShape,
                defaultSize,
                defaultAspect,
                fit,
                cols,
                rowHeight,
              ),
          ],
        );
      },
    );
  }

  Widget _bentoTile(
    BuildContext context,
    Map raw,
    double cellW,
    double cellH,
    double gap,
    String defaultShape,
    String defaultSize,
    double? defaultAspect,
    BoxFit fit,
    int cols,
    double rowHeight,
  ) {
    final data = _data(raw, defaultShape, defaultAspect?.toString());
    final spanCols = data.spanCols.clamp(1, cols);
    final spanRows = data.spanRows.clamp(1, 3);
    final w = cellW * spanCols + gap * (spanCols - 1);
    final h = cellH * spanRows + gap * (spanRows - 1);
    return SizedBox(
      width: w,
      height: h,
      child: _buildTile(
        context,
        raw,
        h.clamp(rowHeight * 0.7, rowHeight * 2.4),
        defaultShape,
        defaultSize,
        defaultAspect,
        fit,
        expand: true,
      ),
    );
  }

  Widget _stagger(
    BuildContext context,
    List<Map> items,
    double height,
    double gap,
    String defaultShape,
    String defaultSize,
    double? defaultAspect,
    BoxFit fit,
  ) {
    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) SizedBox(height: gap),
          Align(
            alignment: i.isEven ? Alignment.centerLeft : Alignment.centerRight,
            child: FractionallySizedBox(
              widthFactor: i.isEven ? 0.94 : 0.8,
              child: _buildTile(
                context,
                items[i],
                height * (i.isEven ? 1 : 0.88),
                defaultShape,
                defaultSize,
                defaultAspect,
                fit,
                expand: true,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _stack(
    BuildContext context,
    List<Map> items,
    String defaultShape,
    double? defaultAspect,
    BoxFit fit,
  ) {
    return Column(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) SizedBox(height: section.marqueeGap ?? 14),
          _buildTile(
            context,
            items[i],
            160,
            defaultShape,
            section.cardSize,
            defaultAspect,
            fit,
            expand: true,
          ),
        ],
      ],
    );
  }
}
