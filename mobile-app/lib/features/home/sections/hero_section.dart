import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../../../data/models/store_world.dart';
import '../../catalog/catalog_providers.dart';
import '../home_category_filter.dart';
import '../home_link.dart';
import '../../worlds/worlds_home_band.dart';
import '../../worlds/worlds_provider.dart';
import '../../worlds/world_theme.dart';
import '../widgets/home_hero_header.dart';
import '../widgets/home_banner_stage.dart';
import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../widgets/home_category_grid.dart';
import '../widgets/home_quick_dock.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class HeroHomeSection extends ConsumerStatefulWidget {
  final HomeSection section;
  const HeroHomeSection({super.key, required this.section});

  @override
  ConsumerState<HeroHomeSection> createState() => _HeroHomeSectionState();
}

class _HeroHomeSectionState extends ConsumerState<HeroHomeSection> {
  int _bannerIndex = 0;
  String? _lastSlug;
  int _slide = 1;

  @override
  Widget build(BuildContext context) {
    final apiCats = ref.watch(categoriesProvider).valueOrNull;
    final fromSection = _normalizeCategories(widget.section.categories);
    final cats = fromSection.isNotEmpty
        ? filterStorefrontCategories(fromSection, apiCats)
        : (apiCats != null ? storefrontParentCategories(apiCats) : <Category>[]);
    final banners = widget.section.banners;
    final worldsAsync = ref.watch(worldsProvider);
    final worlds = worldsAsync.valueOrNull;
    final worldsReady = worlds != null && worlds.isNotEmpty;
    final slug = resolveWorldSlug(selected: ref.watch(selectedWorldSlugProvider), worlds: worlds);
    if (worldsAsync.isLoading && !worldsReady) {
      return const SizedBox(height: 360);
    }
    final world = slug == null ? null : ref.watch(worldDetailProvider(slug)).valueOrNull;
    final t = context.worldTheme;
    final worldCategories = world?.categories ?? const <Category>[];
    final worldList = worlds ?? const <StoreWorld>[];
    if (slug != null && slug != _lastSlug) {
      final previous = worldList.indexWhere((item) => item.slug == _lastSlug);
      final next = worldList.indexWhere((item) => item.slug == slug);
      if (previous >= 0 && next >= 0 && previous != next) {
        _slide = next > previous ? 1 : -1;
      }
      _lastSlug = slug;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (!worldsReady) const HomeHeroHeader(),
        if (worldsReady) ...[
          const WorldTopStage(),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 340),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            layoutBuilder: (current, previous) => Stack(
              alignment: Alignment.topCenter,
              children: [...previous, if (current != null) current],
            ),
            transitionBuilder: (child, animation) {
              final rtl = Directionality.of(context) == TextDirection.rtl;
              final travel = (rtl ? -_slide : _slide) * 0.18;
              final offset = Tween<Offset>(
                begin: Offset(travel, 0),
                end: Offset.zero,
              ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(position: offset, child: child),
              );
            },
            child: Transform.translate(
              key: ValueKey(slug ?? 'world'),
              offset: const Offset(0, -18),
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: t.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [BoxShadow(color: t.ink.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -4))],
                ),
                child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: t.hairline,
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                if (worldCategories.isNotEmpty) ...[
                  HomeHeroCategoryStrip(
                    categories: worldCategories,
                    wash: world == null
                        ? t.accentLight
                        : Color.alphaBlend(world.accent.withValues(alpha: 0.16), t.surface),
                    accent: world?.accent,
                    worldSections: true,
                  ),
                ],
                const WorldHomeBrands(),
                const GiftWorldHomeCard(),
                const SizedBox(height: 8),
              ],
                ),
              ),
            ),
          ),
        ] else ...[
          const SizedBox(height: 12),
          _HeroBannerCarousel(
            section: widget.section,
            banners: banners,
            index: _bannerIndex,
            onChanged: (i) => setState(() => _bannerIndex = i),
          ),
          if (cats.isNotEmpty) ...[
            const HomeSectionDivider(),
            HomeHeroCategoryStrip(categories: cats),
          ],
          const HomeQuickDock(),
        ],
      ],
    );
  }
}

class _HeroBannerCarousel extends StatelessWidget {
  final HomeSection section;
  final List<AppBanner> banners;
  final int index;
  final ValueChanged<int> onChanged;

  const _HeroBannerCarousel({
    required this.section,
    required this.banners,
    required this.index,
    required this.onChanged,
  });

  double _bannerWidth(BuildContext context) =>
      MediaQuery.sizeOf(context).width - HomeTheme.bannerInset * 2;

  @override
  Widget build(BuildContext context) {
    final bannerW = _bannerWidth(context);

    if (banners.isEmpty) {
      return _wrapBanner(
        HomeBannerStage.fromSection(
          banner: const AppBanner(id: 'default'),
          section: section,
          width: bannerW,
          onTap: () => context.push('/products?isFeatured=1'),
        ),
      );
    }

    if (banners.length == 1) {
      return _wrapBanner(
        HomeBannerStage.fromSection(
          banner: banners.first,
          section: section,
          sceneIndex: 0,
          width: bannerW,
          onTap: () => openBannerLink(context, banners.first),
        ),
      );
    }

    final h = homeHeroBannerHeight(context, section: section, width: bannerW);

    return Column(
      children: [
        CarouselSlider(
          options: CarouselOptions(
            height: h,
            viewportFraction: 1,
            padEnds: false,
            autoPlay: true,
            autoPlayInterval: const Duration(seconds: 5),
            autoPlayAnimationDuration: const Duration(milliseconds: 700),
            autoPlayCurve: Curves.easeOut,
            onPageChanged: (i, _) => onChanged(i),
          ),
          items: banners.asMap().entries.map((e) {
            return _wrapBanner(
              HomeBannerStage.fromSection(
                banner: e.value,
                section: section,
                index: e.key,
                sceneIndex: e.key,
                width: bannerW,
                onTap: () => openBannerLink(context, e.value),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 4),
        AnimatedSmoothIndicator(
          activeIndex: index,
          count: banners.length,
          effect: ExpandingDotsEffect(
            dotHeight: 5,
            dotWidth: 5,
            expansionFactor: 3,
            spacing: 6,
            activeDotColor: context.worldTheme.accent,
            dotColor: context.worldTheme.divider,
          ),
        ),
      ],
    );
  }

  Widget _wrapBanner(Widget child) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.bannerInset),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(HomeTheme.bannerRadius),
          boxShadow: HomeTheme.whisperLift,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(HomeTheme.bannerRadius),
          child: child,
        ),
      ),
    );
  }
}

List<Category> _normalizeCategories(List<Category> raw) {
  final seen = <String>{};
  final out = <Category>[];
  for (final c in raw) {
    if (seen.add(c.id)) out.add(c);
  }
  return out;
}

double categoryGridHeight(int count) => 0;

class QuickCategoryGrid extends ConsumerWidget {
  final List<Category> categories;
  const QuickCategoryGrid({super.key, required this.categories});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return HomeCategoryGrid(categories: categories, title: ref.s.categoriesTitle);
  }
}

class CategoryGridSection extends ConsumerWidget {
  final HomeSection section;
  const CategoryGridSection({super.key, required this.section});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final apiCats = ref.watch(categoriesProvider).valueOrNull;
    final cats = filterStorefrontCategories(_normalizeCategories(section.categories), apiCats);
    if (cats.isEmpty) return const SizedBox.shrink();
    return HomeCategoryGrid(
      categories: cats,
      title: section.titleForLang(ref.watch(languageCodeProvider)) ?? ref.s.categoriesTitle,
      showTitle: section.showTitle,
      showViewAll: section.showViewAll,
      onViewAll: section.showViewAll
          ? () => openViewAllLink(
                context,
                query: section.viewAllQuery,
                fallbackQuery: '/categories',
              )
          : null,
    );
  }
}
