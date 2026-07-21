import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/category.dart';
import '../home_link.dart';
import 'home_animations.dart';
import 'home_theme.dart';

/// فئات الهيرو — شبكة 4×2 بنسب ثابتة.
class HomeHeroCategoryStrip extends StatelessWidget {
  final List<Category> categories;
  final int maxItems;

  const HomeHeroCategoryStrip({
    super.key,
    required this.categories,
    this.maxItems = 8,
  });

  static const _columns = 4;
  static const _gap = 8.0;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    final items = categories.take(maxItems.clamp(1, _columns * 2)).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 2, HomeTheme.paddingH, 2),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: _columns,
          mainAxisSpacing: _gap,
          crossAxisSpacing: _gap,
          childAspectRatio: 1.02,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) => _cell(context, items[index], index),
      ),
    );
  }

  Widget _cell(BuildContext context, Category cat, int index) {
    final bg = HomeTheme.categoryTileColors[index % HomeTheme.categoryTileColors.length];

    return HomeTapScale(
      onTap: () => openSectionLink(
        context,
        linkType: cat.linkType,
        linkValue: cat.linkValue,
        legacyLink: cat.link ??
            '/products?categoryId=${cat.id}&title=${Uri.encodeComponent(cat.name)}',
      ),
      child: Column(
        children: [
          Expanded(
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(HomeTheme.tileRadius),
                border: Border.all(color: HomeTheme.surfaceMuted.withValues(alpha: 0.65)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(6),
                child: cat.imageUrl.isNotEmpty
                    ? AppNetworkImage(url: cat.imageUrl, fit: BoxFit.contain)
                    : Center(
                        child: Text(
                          cat.icon ?? cat.name.characters.first,
                          style: const TextStyle(fontSize: 18),
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            cat.name,
            maxLines: 1,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            style: HomeTheme.circleLabel,
          ),
        ],
      ),
    );
  }
}

class HomeCategoryGrid extends StatelessWidget {
  final List<Category> categories;
  final String? title;
  final bool showTitle;
  final bool showViewAll;
  final VoidCallback? onViewAll;

  const HomeCategoryGrid({
    super.key,
    required this.categories,
    this.title,
    this.showTitle = true,
    this.showViewAll = true,
    this.onViewAll,
  });

  static const _tileSize = 72.0;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    final colCount = (categories.length / 2).ceil();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showTitle && title != null && title!.isNotEmpty)
          HomeEditorialHeader(
            title: title!,
            actionLabel: showViewAll ? 'عرض الكل' : null,
            onAction: showViewAll
                ? (onViewAll ?? () => context.push('/categories'))
                : null,
            compact: true,
          ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
          child: SizedBox(
            height: 176,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: colCount,
              separatorBuilder: (_, __) => const SizedBox(width: HomeTheme.itemGap),
              itemBuilder: (_, col) {
                final top = col * 2;
                final bottom = top + 1;
                return SizedBox(
                  width: _tileSize,
                  child: Column(
                    children: [
                      SizedBox(height: 80, child: _tile(context, top)),
                      const SizedBox(height: HomeTheme.itemGap),
                      SizedBox(
                        height: 80,
                        child: bottom < categories.length
                            ? _tile(context, bottom)
                            : const SizedBox.shrink(),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _tile(BuildContext context, int index) {
    final cat = categories[index];
    final bg = HomeTheme.categoryTileColors[index % HomeTheme.categoryTileColors.length];

    return HomeTapScale(
      onTap: () => openSectionLink(
        context,
        linkType: cat.linkType,
        linkValue: cat.linkValue,
        legacyLink: cat.link ??
            '/products?categoryId=${cat.id}&title=${Uri.encodeComponent(cat.name)}',
      ),
      child: Column(
        children: [
          SizedBox(
            width: _tileSize,
            height: 56,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(HomeTheme.tileRadius),
                border: Border.all(color: HomeTheme.surfaceMuted.withValues(alpha: 0.65)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: cat.imageUrl.isNotEmpty
                    ? AppNetworkImage(url: cat.imageUrl, fit: BoxFit.contain)
                    : Center(
                        child: Text(
                          cat.icon ?? cat.name.characters.first,
                          style: const TextStyle(fontSize: 20),
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            cat.name,
            maxLines: 1,
            textAlign: TextAlign.center,
            overflow: TextOverflow.ellipsis,
            style: HomeTheme.circleLabel,
          ),
        ],
      ),
    );
  }
}
