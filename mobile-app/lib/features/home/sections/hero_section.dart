import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_hero_header.dart';
import '../widgets/home_banner_stage.dart';
import '../widgets/home_category_grid.dart';
import '../widgets/home_quick_dock.dart';
import '../widgets/home_theme.dart';

class HeroHomeSection extends ConsumerStatefulWidget {
  final HomeSection section;
  const HeroHomeSection({super.key, required this.section});

  @override
  ConsumerState<HeroHomeSection> createState() => _HeroHomeSectionState();
}

class _HeroHomeSectionState extends ConsumerState<HeroHomeSection> {
  int _bannerIndex = 0;

  @override
  Widget build(BuildContext context) {
    final cats = _normalizeCategories(widget.section.categories);
    final banners = widget.section.banners;

    return DecoratedBox(
      decoration: HomeTheme.heroHeaderDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const HomeHeroHeader(),
          const SizedBox(height: 14),
          _HeroBannerCarousel(
            section: widget.section,
            banners: banners,
            index: _bannerIndex,
            onChanged: (i) => setState(() => _bannerIndex = i),
          ),
          const HomeQuickDock(),
          if (cats.isNotEmpty) HomeHeroCategoryStrip(categories: cats),
        ],
      ),
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
            activeDotColor: AppColors.primary,
            dotColor: HomeTheme.sageMid,
          ),
        ),
      ],
    );
  }

  Widget _wrapBanner(Widget child) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: HomeTheme.bannerInset),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(HomeTheme.bannerRadius),
        child: child,
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
    return HomeCategoryGrid(categories: categories, title: 'الفئات');
  }
}

class CategoryGridSection extends StatelessWidget {
  final HomeSection section;
  const CategoryGridSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final cats = _normalizeCategories(section.categories);
    if (cats.isEmpty) return const SizedBox.shrink();
    return HomeCategoryGrid(
      categories: cats,
      title: section.title ?? 'الفئات',
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
