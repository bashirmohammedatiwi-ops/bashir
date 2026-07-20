import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class CircleTilesSection extends StatelessWidget {
  final HomeSection section;
  const CircleTilesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final items = section.items;
    if (items.isEmpty) return const SizedBox.shrink();

    final layout = section.sectionLayout ?? section.layout ?? 'row';

    return HomeSectionShell(
      section: section,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        child: layout == 'row'
            ? _CircleRow(items: items)
            : _CircleGrid(items: items, columns: layout == 'grid3' ? 3 : 4),
      ),
    );
  }
}

class _CircleRow extends StatelessWidget {
  final List<dynamic> items;
  const _CircleRow({required this.items});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 4),
        itemBuilder: (_, i) => _buildTile(context, items[i]),
      ),
    );
  }
}

class _CircleGrid extends StatelessWidget {
  final List<dynamic> items;
  final int columns;
  const _CircleGrid({required this.items, required this.columns});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      alignment: WrapAlignment.center,
      children: [
        for (var i = 0; i < items.length; i++)
          SizedBox(
            width: (MediaQuery.sizeOf(context).width - AppSpacing.screenH * 2 - AppSpacing.sm * (columns - 1)) / columns,
            child: _buildTile(context, items[i]),
          ),
      ],
    );
  }
}

Widget _buildTile(BuildContext context, dynamic data) {
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
