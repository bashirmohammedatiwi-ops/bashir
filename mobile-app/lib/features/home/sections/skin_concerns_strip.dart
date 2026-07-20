import 'package:flutter/material.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/category.dart';
import '../home_link.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_theme.dart';

/// شريط مشاكل البشرة — pills / circles / cards بأسلوب Beautief.
class SkinConcernsStrip extends StatelessWidget {
  final List<Category> concerns;
  final String? title;
  final String? subtitle;
  final String display;
  final bool showTitle;

  const SkinConcernsStrip({
    super.key,
    required this.concerns,
    this.title,
    this.subtitle,
    this.display = 'chips',
    this.showTitle = true,
  });

  @override
  Widget build(BuildContext context) {
    if (concerns.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showTitle && title != null && title!.isNotEmpty)
          HomeEditorialHeader(
            title: title!,
            subtitle: subtitle,
            overline: 'دليل البشرة',
            compact: true,
          ),
        if (display == 'circles') _CirclesRow(concerns: concerns),
        if (display == 'cards') _CardsList(concerns: concerns),
        if (display != 'circles' && display != 'cards') _PillsRow(concerns: concerns),
      ],
    );
  }
}

void _openConcern(BuildContext context, Category concern) {
  openSectionLink(
    context,
    linkType: concern.linkType ?? 'skinConcern',
    linkValue: concern.linkValue ?? concern.slug,
    legacyLink: concern.link ?? '/products?concernSlug=${Uri.encodeComponent(concern.slug)}',
  );
}

class _PillsRow extends StatelessWidget {
  final List<Category> concerns;

  const _PillsRow({required this.concerns});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        itemCount: concerns.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) {
          final c = concerns[i];
          return HomeFilterPill(
            label: c.name,
            icon: c.icon,
            selected: false,
            onTap: () => _openConcern(context, c),
          );
        },
      ),
    );
  }
}

class _CirclesRow extends StatelessWidget {
  final List<Category> concerns;

  const _CirclesRow({required this.concerns});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 100,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        itemCount: concerns.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (_, i) {
          final c = concerns[i];
          return CircleTile(
            title: c.name,
            imageUrl: c.imageUrl.isNotEmpty ? c.imageUrl : null,
            icon: c.icon,
            width: 76,
            onTap: () => _openConcern(context, c),
          );
        },
      ),
    );
  }
}

class _CardsList extends StatelessWidget {
  final List<Category> concerns;

  const _CardsList({required this.concerns});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 116,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        itemCount: concerns.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final c = concerns[i];
          return Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(HomeTheme.tileRadius),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () => _openConcern(context, c),
              child: SizedBox(
                width: 230,
                child: Row(
                  children: [
                    SizedBox(
                      width: 84,
                      height: double.infinity,
                      child: c.imageUrl.isNotEmpty
                          ? AppNetworkImage(url: c.imageUrl, fit: BoxFit.cover)
                          : ColoredBox(
                              color: HomeTheme.blush,
                              child: Center(child: Text(c.icon ?? '✨', style: const TextStyle(fontSize: 28))),
                            ),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(c.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: HomeTheme.chipLabel),
                            if (c.description != null && c.description!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                c.description!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: HomeTheme.body(size: 11),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
