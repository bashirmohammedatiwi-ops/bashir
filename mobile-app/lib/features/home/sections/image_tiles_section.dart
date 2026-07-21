import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';
import '../widgets/photo_shape_kit.dart';

class ImageTilesSection extends StatelessWidget {
  final HomeSection section;
  const ImageTilesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    if (items.isEmpty) return const SizedBox.shrink();

    final layout = section.sectionLayout ?? section.layout ?? 'grid2';
    final shape = section.shape ?? 'rect';
    final cols = _columnsFor(section, layout);
    final useMosaic = shape == 'rect' && layout == 'mosaic' && items.length >= 3;

    if (shape == 'circle') {
      return HomeSectionShell(
        section: section,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
          child: Wrap(
            spacing: AppSpacing.sm,
            runSpacing: AppSpacing.sm,
            children: [
              for (var i = 0; i < items.length; i++)
                SizedBox(
                  width: (MediaQuery.sizeOf(context).width - HomeTheme.paddingH * 2 - AppSpacing.sm * (cols - 1)) / cols,
                  child: _CircleImageTile(data: items[i]),
                ),
            ],
          ),
        ),
      );
    }

    return HomeSectionShell(
      section: section,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        child: useMosaic
            ? _MosaicLayout(items: items, section: section)
            : _UniformGrid(items: items, columns: cols, section: section),
      ),
    );
  }
}

int _columnsFor(HomeSection section, String layout) {
  if (layout == 'grid3') return 3;
  if (layout.startsWith('grid')) {
    final n = int.tryParse(layout.replaceAll('grid', ''));
    if (n != null && n > 0) return n;
  }
  return 2;
}

double _tileHeight(Map<String, dynamic> m, HomeSection section, int index) {
  final cardSize = m['cardSize']?.toString();
  return resolveItemCardSize(
    cardSize: cardSize,
    sectionLayout: section.sectionLayout,
    index: index,
    defaultSize: section.cardSize,
  ).height;
}

class _CircleImageTile extends StatelessWidget {
  final dynamic data;
  const _CircleImageTile({required this.data});

  @override
  Widget build(BuildContext context) {
    if (data is! Map) return const SizedBox.shrink();
    final m = Map<String, dynamic>.from(data);
    return CircleTile(
      title: m['title']?.toString() ?? '',
      subtitle: m['subtitle']?.toString(),
      imageUrl: m['imageUrl']?.toString(),
      cardSize: m['cardSize']?.toString(),
      onTap: () => openSectionLink(
        context,
        linkType: m['linkType']?.toString(),
        linkValue: m['linkValue']?.toString(),
        legacyLink: m['link']?.toString(),
      ),
    );
  }
}

class _MosaicLayout extends StatelessWidget {
  final List<dynamic> items;
  final HomeSection section;

  const _MosaicLayout({required this.items, required this.section});

  @override
  Widget build(BuildContext context) {
    final mainH = _tileHeight(Map<String, dynamic>.from(items[0] as Map), section, 0);
    final sideH = items.length > 1
        ? _tileHeight(Map<String, dynamic>.from(items[1] as Map), section, 1)
        : mainH;

    return Column(
      children: [
        SizedBox(
          height: mainH.clamp(160, 220),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 3,
                child: _ImageTile(data: items[0], radius: HomeTheme.cardRadius, index: 0, section: section),
              ),
              if (items.length > 1) ...[
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      Expanded(child: _ImageTile(data: items[1], radius: HomeTheme.tileRadius, index: 1, section: section)),
                      if (items.length > 2) ...[
                        const SizedBox(height: AppSpacing.sm),
                        Expanded(child: _ImageTile(data: items[2], radius: HomeTheme.tileRadius, index: 2, section: section)),
                      ],
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        if (items.length > 3) ...[
          const SizedBox(height: AppSpacing.sm),
          SizedBox(
            height: (sideH * 0.72).clamp(96, 140),
            child: Row(
              children: [
                for (var i = 3; i < items.length && i < 5; i++) ...[
                  if (i > 3) const SizedBox(width: AppSpacing.sm),
                  Expanded(child: _ImageTile(data: items[i], radius: HomeTheme.tileRadius, index: i, section: section)),
                ],
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _UniformGrid extends StatelessWidget {
  final List<dynamic> items;
  final int columns;
  final HomeSection section;

  const _UniformGrid({required this.items, required this.columns, required this.section});

  @override
  Widget build(BuildContext context) {
    const gap = AppSpacing.sm;
    final screenW = MediaQuery.sizeOf(context).width;
    final tileW = (screenW - HomeTheme.paddingH * 2 - gap * (columns - 1)) / columns;

    return Wrap(
      spacing: gap,
      runSpacing: gap,
      children: [
        for (var i = 0; i < items.length; i++)
          SizedBox(
            width: tileW,
            height: _tileHeight(Map<String, dynamic>.from(items[i] as Map), section, i),
            child: _ImageTile(data: items[i], radius: HomeTheme.tileRadius, index: i, section: section),
          ),
      ],
    );
  }
}

class _ImageTile extends StatelessWidget {
  final dynamic data;
  final double radius;
  final int index;
  final HomeSection section;

  const _ImageTile({
    required this.data,
    required this.radius,
    required this.index,
    required this.section,
  });

  @override
  Widget build(BuildContext context) {
    if (data is! Map) return const SizedBox.shrink();
    final m = Map<String, dynamic>.from(data);
    final shape = section.shape ?? 'rounded';
    final tileData = PhotoTileData.fromMap(
      m,
      defaultShape: shape == 'circle' ? 'circle' : 'rounded',
      defaultOverlay: 'gradient',
    );
    if (tileData.imageUrl.isEmpty) return const SizedBox.shrink();

    final h = _tileHeight(m, section, index);

    return PhotoTile(
      data: tileData,
      width: double.infinity,
      height: h,
      expand: false,
      onTap: () => openSectionLink(
        context,
        linkType: m['linkType']?.toString(),
        linkValue: m['linkValue']?.toString(),
        legacyLink: m['link']?.toString(),
      ),
    );
  }
}
