import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/locale_provider.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/category.dart';
import '../home_link.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_theme.dart';

/// شريط مشاكل البشرة — pills / circles / cards بأسلوب Beautief.
class SkinConcernsStrip extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    if (concerns.isEmpty) return const SizedBox.shrink();

    final lang = ref.watch(languageCodeProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showTitle && title != null && title!.isNotEmpty)
          HomeEditorialHeader(
            title: title!,
            compact: true,
          ),
        if (display == 'circles') _CirclesRow(concerns: concerns, lang: lang),
        if (display == 'cards') _CardsList(concerns: concerns, lang: lang),
        if (display != 'circles' && display != 'cards') _PillsRow(concerns: concerns, lang: lang),
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
  final String lang;

  const _PillsRow({required this.concerns, required this.lang});

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
            label: c.localizedName(lang),
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
  final String lang;

  const _CirclesRow({required this.concerns, required this.lang});

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
            title: c.localizedName(lang),
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
  final String lang;

  const _CardsList({required this.concerns, required this.lang});

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
          final description = c.localizedDescription(lang);
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
                            Text(
                              c.localizedName(lang),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: HomeTheme.chipLabel,
                            ),
                            if (description.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                description,
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
