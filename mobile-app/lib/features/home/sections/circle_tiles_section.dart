import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/utils/json.dart';
import '../../../core/utils/media_url.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class CircleTilesSection extends ConsumerWidget {
  final HomeSection section;
  const CircleTilesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    var items = section.items;
    if (items.isEmpty && section.categories.isNotEmpty) {
      items = section.categories
          .map((c) => {
                'id': c.id,
                'title': c.nameAr ?? c.name,
                'imageUrl': c.imageUrl,
                'linkType': c.linkType ?? 'category',
                'linkValue': c.linkValue ?? c.id,
                'link': c.link ?? '/products?categoryId=${c.id}',
              })
          .toList();
    }
    if (items.isEmpty) return const SizedBox.shrink();

    final layout = section.sectionLayout ?? section.layout ?? 'row';

    return HomeSectionShell(
      section: section,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        child: layout == 'row'
            ? _CircleRow(items: items, lang: lang)
            : _CircleGrid(items: items, columns: layout == 'grid3' ? 3 : 4, lang: lang),
      ),
    );
  }
}

class _CircleRow extends StatelessWidget {
  final List<dynamic> items;
  final String lang;
  const _CircleRow({required this.items, required this.lang});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 4),
        itemBuilder: (_, i) => _buildTile(context, items[i], lang),
      ),
    );
  }
}

class _CircleGrid extends StatelessWidget {
  final List<dynamic> items;
  final int columns;
  final String lang;
  const _CircleGrid({required this.items, required this.columns, required this.lang});

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
            child: _buildTile(context, items[i], lang),
          ),
      ],
    );
  }
}

Widget _buildTile(BuildContext context, dynamic data, String lang) {
  if (data is! Map) return const SizedBox.shrink();
  final m = Map<String, dynamic>.from(data);
  final title = cmsTextForLang(m, lang);
  final subtitle = cmsTextForLang(m, lang, arKey: 'subtitle', enKey: 'subtitleEn');
  return CircleTile(
    title: title.isNotEmpty ? title : (m['title']?.toString() ?? ''),
    subtitle: subtitle.isNotEmpty ? subtitle : m['subtitle']?.toString(),
    imageUrl: resolveImageFromPayload(
      directUrl: m['imageUrl']?.toString(),
      image: m['image'] is Map ? asMap(m['image']) : null,
    ),
    cardSize: m['cardSize']?.toString(),
    onTap: () => openSectionLink(
      context,
      linkType: m['linkType']?.toString(),
      linkValue: m['linkValue']?.toString(),
      legacyLink: m['link']?.toString(),
    ),
  );
}
