import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../sections/product_sections.dart';
import '../sections/routine_carousel_section.dart';
import '../sections/skin_concerns_strip.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_section_shell.dart';

class CareHubSection extends StatefulWidget {
  final HomeSection section;
  final bool compactTop;
  const CareHubSection({super.key, required this.section, this.compactTop = false});

  @override
  State<CareHubSection> createState() => _CareHubSectionState();
}

class _CareHubSectionState extends State<CareHubSection> {
  int _tab = 0;

  HomeSection get _section => widget.section;

  @override
  Widget build(BuildContext context) {
    final layout = _section.display ?? _section.layout ?? 'stacked';
    final hasConcerns = _section.skinConcerns.isNotEmpty;
    final hasPackages = _section.packages.isNotEmpty;
    final hasCategories = _section.categories.isNotEmpty;
    final hasProducts = _section.products.isNotEmpty;

    if (!hasConcerns && !hasPackages && !hasCategories && !hasProducts) {
      return const SizedBox.shrink();
    }

    if (layout == 'tabs') {
      final tabs = <String>[];
      if (hasConcerns) tabs.add('مشاكل');
      if (hasPackages) tabs.add('روتين');
      if (hasCategories) tabs.add('أقسام');
      if (hasProducts) tabs.add('منتجات');

      return HomeSectionShell(
        section: _section,
        compactTop: widget.compactTop,
        child: Column(
          children: [
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
                itemCount: tabs.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final selected = _tab == i;
                  return ChoiceChip(
                    label: Text(tabs[i]),
                    selected: selected,
                    onSelected: (_) => setState(() => _tab = i),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            _tabBody(tabs[_tab.clamp(0, tabs.length - 1)]),
          ],
        ),
      );
    }

    return HomeSectionShell(
      section: _section,
      compactTop: widget.compactTop,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (hasConcerns) _ConcernsRow(concerns: _section.skinConcerns),
          if (hasPackages) ...[
            const SizedBox(height: AppSpacing.md),
            RoutineCarouselSection(
              section: HomeSection(
                id: '${_section.id}-routine',
                type: 'ROUTINE_CAROUSEL',
                title: 'روتين البشرة',
                showTitle: true,
                packages: _section.packages,
                cardSize: _section.cardSize,
                showViewAll: _section.showViewAll,
                viewAllQuery: _section.viewAllQuery,
              ),
              nested: true,
            ),
          ],
          if (hasCategories) ...[
            const SizedBox(height: AppSpacing.sm),
            _CategoryCircles(categories: _section.categories),
          ],
          if (hasProducts) ...[
            const SizedBox(height: AppSpacing.sm),
            ProductCarouselSection(
              section: HomeSection(
                id: '${_section.id}-products',
                type: 'PRODUCT_LIST',
                title: 'منتجات العناية',
                showTitle: true,
                products: _section.products,
                productCardSize: _section.productCardSize,
                cardSize: _section.cardSize,
                showViewAll: _section.showViewAll,
                viewAllQuery: _section.viewAllQuery,
              ),
              nested: true,
            ),
          ],
        ],
      ),
    );
  }

  Widget _tabBody(String tab) {
    switch (tab) {
      case 'مشاكل':
        return _ConcernsRow(concerns: _section.skinConcerns);
      case 'روتين':
        return RoutineCarouselSection(
          section: HomeSection(
            id: '${_section.id}-routine-tab',
            type: 'ROUTINE_CAROUSEL',
            title: 'روتين البشرة',
            showTitle: true,
            packages: _section.packages,
            cardSize: _section.cardSize,
            showViewAll: _section.showViewAll,
            viewAllQuery: _section.viewAllQuery,
          ),
        );
      case 'أقسام':
        return _CategoryCircles(categories: _section.categories);
      case 'منتجات':
        return ProductCarouselSection(
          section: HomeSection(
            id: '${_section.id}-products-tab',
            type: 'PRODUCT_LIST',
            title: 'منتجات العناية',
            showTitle: true,
            products: _section.products,
            productCardSize: _section.productCardSize,
            showViewAll: _section.showViewAll,
            viewAllQuery: _section.viewAllQuery,
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class _ConcernsRow extends StatelessWidget {
  final List<Category> concerns;
  const _ConcernsRow({required this.concerns});

  @override
  Widget build(BuildContext context) {
    return SkinConcernsStrip(
      concerns: concerns,
      display: 'circles',
      showTitle: false,
    );
  }
}

class _CategoryCircles extends StatelessWidget {
  final List<Category> categories;
  const _CategoryCircles({required this.categories});

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 4),
        itemBuilder: (_, i) {
          final c = categories[i];
          return CircleTile(
            title: c.name,
            imageUrl: c.imageUrl,
            icon: c.icon,
            cardSize: c.cardSize,
            onTap: () => openSectionLink(
              context,
              linkType: c.linkType,
              linkValue: c.linkValue,
              legacyLink: c.link ?? '/products?categoryId=${c.id}',
            ),
          );
        },
      ),
    );
  }
}
