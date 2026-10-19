import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/navigation/app_navigation.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../home_strings.dart';
import '../sections/product_sections.dart';
import '../sections/routine_carousel_section.dart';
import '../sections/skin_concerns_strip.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

enum _CareHubTab { concerns, routine, categories, products }

class CareHubSection extends ConsumerStatefulWidget {
  final HomeSection section;
  final bool compactTop;
  const CareHubSection({
    super.key,
    required this.section,
    this.compactTop = false,
  });

  @override
  ConsumerState<CareHubSection> createState() => _CareHubSectionState();
}

class _CareHubSectionState extends ConsumerState<CareHubSection> {
  int _tab = 0;

  HomeSection get _section => widget.section;

  List<_CareHubTab> _tabs(
    bool hasConcerns,
    bool hasPackages,
    bool hasCategories,
    bool hasProducts,
  ) {
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

  /// «عرض الكل» لكل تبويب يذهب لوجهته: الروتينات، دليل البشرة، الأقسام، أو المنتجات —
  /// لا قائمة المنتجات للجميع.
  VoidCallback _viewAll(_CareHubTab tab) => switch (tab) {
    _CareHubTab.routine => () => openViewAllLink(
      context,
      query: '/packages?tab=routines',
    ),
    _CareHubTab.concerns => () => openViewAllLink(
      context,
      query: '/skin-guide',
    ),
    _CareHubTab.categories => () => openCategoriesTab(
      context,
      ProviderScope.containerOf(context, listen: false),
    ),
    _CareHubTab.products => () => openViewAllLink(
      context,
      query: _section.viewAllQuery,
      fallbackQuery: 'isBestSeller=1',
    ),
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
      final current = tabs[_tab.clamp(0, tabs.length - 1)];
      final reduceMotion = MediaQuery.disableAnimationsOf(context);

      return HomeSectionShell(
        section: _section,
        compactTop: widget.compactTop,
        actionLabel: _section.showViewAll ? s.viewAll : null,
        onAction: _section.showViewAll ? _viewAll(current) : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: kMinTapTarget,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.screenH,
                ),
                itemCount: tabs.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) => Center(
                  child: Semantics(
                    selected: tabs[i] == current,
                    child: HomeFilterPill(
                      label: _tabLabel(s, tabs[i]),
                      selected: tabs[i] == current,
                      onTap: () {
                        if (tabs[i] == current) return;
                        HapticFeedback.selectionClick();
                        setState(() => _tab = i);
                      },
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            AnimatedSwitcher(
              duration: reduceMotion
                  ? Duration.zero
                  : const Duration(milliseconds: 220),
              switchInCurve: Curves.easeOutCubic,
              switchOutCurve: Curves.easeInCubic,
              layoutBuilder: (current, previous) => Stack(
                alignment: AlignmentDirectional.topStart,
                children: [...previous, if (current != null) current],
              ),
              transitionBuilder: (child, animation) =>
                  FadeTransition(opacity: animation, child: child),
              child: KeyedSubtree(
                key: ValueKey(current),
                child: _tabBody(current, s, lang),
              ),
            ),
          ],
        ),
      );
    }

    // مكدّس: كل صف بعنوان صغير حتى لا تبدو أربعة صفوف بلا تسمية.
    Widget header(String title, _CareHubTab tab) => HomeEditorialHeader(
      title: title,
      compact: true,
      actionLabel: _section.showViewAll ? s.viewAll : null,
      onAction: _section.showViewAll ? _viewAll(tab) : null,
    );

    return HomeSectionShell(
      section: _section,
      compactTop: widget.compactTop,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (hasConcerns) ...[
            header(s.careHubConcerns, _CareHubTab.concerns),
            _ConcernsRow(concerns: _section.skinConcerns),
          ],
          if (hasPackages) ...[
            const SizedBox(height: AppSpacing.md),
            header(s.skinRoutineTitle, _CareHubTab.routine),
            _routineRow('${_section.id}-routine', s),
          ],
          if (hasCategories) ...[
            const SizedBox(height: AppSpacing.md),
            header(s.careHubCategories, _CareHubTab.categories),
            _CategoryCircles(categories: _section.categories, lang: lang),
          ],
          if (hasProducts) ...[
            const SizedBox(height: AppSpacing.md),
            header(s.careProductsTitle, _CareHubTab.products),
            _productsRow('${_section.id}-products', s),
          ],
        ],
      ),
    );
  }

  Widget _routineRow(String id, AppStrings s) => RoutineCarouselSection(
    section: HomeSection(
      id: id,
      type: 'ROUTINE_CAROUSEL',
      title: s.skinRoutineTitle,
      packages: _section.packages,
      cardSize: _section.cardSize,
      showViewAll: false,
    ),
    nested: true,
  );

  Widget _productsRow(String id, AppStrings s) => ProductCarouselSection(
    section: HomeSection(
      id: id,
      type: 'PRODUCT_LIST',
      title: s.careProductsTitle,
      products: _section.products,
      productCardSize: _section.productCardSize,
      cardSize: _section.cardSize,
      showViewAll: _section.showViewAll,
      viewAllQuery: _section.viewAllQuery,
    ),
    nested: true,
  );

  Widget _tabBody(_CareHubTab tab, AppStrings s, String lang) {
    switch (tab) {
      case _CareHubTab.concerns:
        return _ConcernsRow(concerns: _section.skinConcerns);
      case _CareHubTab.routine:
        return _routineRow('${_section.id}-routine-tab', s);
      case _CareHubTab.categories:
        return _CategoryCircles(categories: _section.categories, lang: lang);
      case _CareHubTab.products:
        return _productsRow('${_section.id}-products-tab', s);
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
    // دائرة 68 + فراغ 8 + سطرا الاسم بمقياس خط الجهاز.
    final height =
        68 + 8 + MediaQuery.textScalerOf(context).scale(11) * 1.15 * 2 + 8;
    return SizedBox(
      height: height,
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
            // رابط مخصّص من لوحة التحكم، وإلا قائمة القسم بمستواه الصحيح في الشجرة
            // (القسم الفرعي بـ categoryId كان يفتح قائمة فارغة).
            onTap: () => openCategoryLink(context, c),
          );
        },
      ),
    );
  }
}
