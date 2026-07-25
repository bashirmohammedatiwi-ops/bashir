import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/category.dart';
import '../home_link.dart';
import 'home_animations.dart';
import 'home_section_shell.dart';
import 'home_theme.dart';

/// فئات الهيرو — تمرير أفقي على خلفية بيضاء.
class HomeHeroCategoryStrip extends StatelessWidget {
  final List<Category> categories;

  const HomeHeroCategoryStrip({
    super.key,
    required this.categories,
  });

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        HomeSectionHeader(
          title: 'تسوقي حسب القسم',
          compact: true,
          actionLabel: 'الكل',
          onAction: () => context.push('/categories'),
        ),
        SizedBox(
          height: 108,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, i) => _CategoryCircleTile(category: categories[i], index: i),
          ),
        ),
        const SizedBox(height: 8),
      ],
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

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showTitle && title != null && title!.isNotEmpty)
          HomeSectionHeader(
            title: title!,
            actionLabel: showViewAll ? 'عرض الكل' : null,
            onAction: showViewAll
                ? (onViewAll ?? () => context.push('/categories'))
                : null,
            compact: true,
          ),
        SizedBox(
          height: 108,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
            itemCount: categories.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, i) => _CategoryCircleTile(category: categories[i], index: i),
          ),
        ),
      ],
    );
  }
}

class _CategoryCircleTile extends StatelessWidget {
  final Category category;
  final int index;

  const _CategoryCircleTile({required this.category, required this.index});

  static const _size = 62.0;

  @override
  Widget build(BuildContext context) {
    final accent = HomeTheme.categoryTileColors[index % HomeTheme.categoryTileColors.length];

    return HomeTapScale(
      onTap: () => openSectionLink(
        context,
        linkType: category.linkType,
        linkValue: category.linkValue,
        legacyLink: category.link ??
            '/products?categoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: _size,
            height: _size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: HomeTheme.surface,
              border: Border.all(color: HomeTheme.divider, width: 1),
            ),
            child: ClipOval(
              child: category.imageUrl.isNotEmpty
                  ? AppNetworkImage(
                      url: category.imageUrl,
                      width: _size,
                      height: _size,
                      fit: BoxFit.cover,
                    )
                  : ColoredBox(
                      color: accent,
                      child: Center(
                        child: Text(
                          category.icon ?? category.name.characters.first,
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: HomeTheme.inkSoft.withValues(alpha: 0.85),
                          ),
                        ),
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            width: 68,
            child: Text(
              category.name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: HomeTheme.circleLabel.copyWith(fontSize: 10.5, height: 1.15),
            ),
          ),
        ],
      ),
    );
  }
}
