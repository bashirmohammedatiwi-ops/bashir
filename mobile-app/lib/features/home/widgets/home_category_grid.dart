import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/category.dart';
import '../home_link.dart';
import 'home_animations.dart';
import 'home_theme.dart';

/// أيقونات الفئات أسفل البنر — شبكة 4×2 مع اسم مختصر.
class HomeHeroCategoryStrip extends StatelessWidget {
  final List<Category> categories;
  final int maxItems;

  const HomeHeroCategoryStrip({
    super.key,
    required this.categories,
    this.maxItems = 8,
  });

  static const _columns = 4;
  static const _rows = 2;
  static const _gap = 10.0;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    final items = categories.take(maxItems.clamp(1, _columns * _rows)).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: _columns,
          mainAxisSpacing: _gap,
          crossAxisSpacing: _gap,
          childAspectRatio: 0.82,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) => _cell(context, index, items),
      ),
    );
  }

  Widget _cell(BuildContext context, int index, List<Category> items) {
    final cat = items[index];
    final bg = HomeTheme.categoryTileColors[index % HomeTheme.categoryTileColors.length];

    return HomeStaggerItem(
      index: index,
      child: HomeTapScale(
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
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(HomeTheme.tileRadius),
                  border: Border.all(color: HomeTheme.surfaceMuted.withValues(alpha: 0.6)),
                ),
                padding: const EdgeInsets.all(10),
                child: cat.imageUrl.isNotEmpty
                    ? AppNetworkImage(url: cat.imageUrl, fit: BoxFit.contain)
                    : Center(
                        child: Text(
                          cat.icon ?? cat.name.characters.first,
                          style: const TextStyle(fontSize: 22),
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
      ),
    );
  }
}

/// شبكة فئات — تمرير أفقي داخل بطاقة.
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

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    final colCount = (categories.length / 2).ceil();
    const tileW = 72.0;

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
            height: 172,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: colCount,
              separatorBuilder: (_, __) => const SizedBox(width: HomeTheme.itemGap),
              itemBuilder: (_, col) {
                final top = col * 2;
                final bottom = top + 1;
                return HomeStaggerItem(
                  index: col,
                  child: SizedBox(
                    width: tileW,
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
          Container(
            width: 72,
            height: 56,
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(HomeTheme.tileRadius),
            ),
            padding: const EdgeInsets.all(8),
            child: cat.imageUrl.isNotEmpty
                ? AppNetworkImage(url: cat.imageUrl, fit: BoxFit.contain)
                : Center(
                    child: Text(
                      cat.icon ?? cat.name.characters.first,
                      style: const TextStyle(fontSize: 22),
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
