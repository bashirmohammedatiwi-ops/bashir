import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../sections/product_sections.dart';
import '../sections/routine_carousel_section.dart';
import '../sections/skin_concerns_strip.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_section_shell.dart';

enum _CareHubTab { concerns, routine, categories, products }

class CareHubSection extends ConsumerStatefulWidget {
  final HomeSection section;
  final bool compactTop;
  const CareHubSection({super.key, required this.section, this.compactTop = false});

  @override
  ConsumerState<CareHubSection> createState() => _CareHubSectionState();
}

class _CareHubSectionState extends ConsumerState<CareHubSection> {
  int _tab = 0;

  HomeSection get _section => widget.section;

  List<_CareHubTab> _tabs(bool hasConcerns, bool hasPackages, bool hasCategories, bool hasProducts) {
    final tabs = <_CareHubTab>[];
    if (hasConcerns) tabs.add(_CareHubTab.concerns);
    if (hasPackages) tabs.add(_CareHubTab.routine);
    if (hasCategories) tabs.add(_CareHubTab.categories);
    if (hasProducts) tabs.add(_CareHubTab.products);
    return tabs;
  }

  String _tabLabel(AppStrings s, _CareHubTab tab) => switch (tab) {
        _CareHubTab.concerns => s.careTabConcerns,
        _CareHubTab.routine => s.careTabRoutine,
        _CareHubTab.categories => s.careTabCategories,
        _CareHubTab.products => s.careTabProducts,
      };

  @override
  Widget build(BuildContext context) {
    final s = ref.s;
    final lang = ref.watch(languageCodeProvider);
    final layout = _section.display ?? _section.layout ?? 'stacked';
    final hasConcerns = _section.skinConcerns.isNotEmpty;
    final hasPackages = _section.packages.isNotEmpty;
    final hasCategories = _section.categories.isNotEmpty;
    final hasProducts = _section.products.isNotEmpty;

    if (!hasConcerns && !hasPackages && !hasCategories && !hasProducts) {
      return const SizedBox.shrink();
    }

    if (layout == 'tabs') {
      final tabs = _tabs(hasConcerns, hasPackages, hasCategories, hasProducts);

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
                    label: Text(_tabLabel(s, tabs[i])),
                    selected: selected,
                    onSelected: (_) => setState(() => _tab = i),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),
            _tabBody(tabs[_tab.clamp(0, tabs.length - 1)], s, lang),
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
                title: s.skinRoutineTitle,
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
            _CategoryCircles(categories: _section.categories, lang: lang),
          ],
          if (hasProducts) ...[
            const SizedBox(height: AppSpacing.sm),
            ProductCarouselSection(
              section: HomeSection(
                id: '${_section.id}-products',
                type: 'PRODUCT_LIST',
                title: s.careProductsTitle,
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

  Widget _tabBody(_CareHubTab tab, AppStrings s, String lang) {
    switch (tab) {
      case _CareHubTab.concerns:
        return _ConcernsRow(concerns: _section.skinConcerns);
      case _CareHubTab.routine:
        return RoutineCarouselSection(
          section: HomeSection(
            id: '${_section.id}-routine-tab',
            type: 'ROUTINE_CAROUSEL',
            title: s.skinRoutineTitle,
            showTitle: true,
            packages: _section.packages,
            cardSize: _section.cardSize,
            showViewAll: _section.showViewAll,
            viewAllQuery: _section.viewAllQuery,
          ),
        );
      case _CareHubTab.categories:
        return _CategoryCircles(categories: _section.categories, lang: lang);
      case _CareHubTab.products:
        return ProductCarouselSection(
          section: HomeSection(
            id: '${_section.id}-products-tab',
            type: 'PRODUCT_LIST',
            title: s.careProductsTitle,
            showTitle: true,
            products: _section.products,
            productCardSize: _section.productCardSize,
            cardSize: _section.cardSize,
            showViewAll: _section.showViewAll,
            viewAllQuery: _section.viewAllQuery,
          ),
        );
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
  final String lang;
  const _CategoryCircles({required this.categories, required this.lang});

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
            title: c.localizedName(lang),
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
