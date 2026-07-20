import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/home_feed.dart';
import '../../data/models/home_section.dart';
import '../../core/theme/card_sizes.dart';
import 'sections/banner_sections.dart';
import 'sections/brand_sections.dart';
import 'sections/category_sections.dart';
import 'sections/hero_section.dart';
import 'sections/product_sections.dart';
import 'sections/image_tiles_section.dart';
import 'sections/circle_tiles_section.dart';
import 'sections/care_hub_section.dart';
import 'sections/routine_carousel_section.dart';
import 'sections/image_marquee_section.dart';
import 'sections/promo_sections.dart';
import 'sections/skin_concerns_strip.dart';
import 'widgets/home_animations.dart';
import 'widgets/home_theme.dart';

export 'sections/hero_section.dart' show HeroHomeSection;

class HomeSectionWidget extends ConsumerWidget {
  final HomeSection section;
  final bool isFirstAfterHero;

  const HomeSectionWidget({
    super.key,
    required this.section,
    this.isFirstAfterHero = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (section.type == 'HERO_BANNER') {
      return HeroHomeSection(section: section);
    }

    final child = switch (section.type) {
      'CATEGORY_GRID' => CategoryGridSection(section: section),
      'CATEGORY_TILES' => CategoryTilesSection(section: section),
      'MAKEUP_CATEGORIES' => MakeupCategoriesSection(section: section),
      'BANNER_FULL' || 'CUSTOM_BANNER' => BannerFullSection(section: section),
      'BANNER_GRID_2' => BannerGridSection(section: section, columns: 2),
      'BANNER_GRID_3' => BannerGridSection(section: section, columns: 3),
      'BANNER_CAROUSEL' => BannerCarouselSection(section: section),
      'PRODUCT_LIST' => ProductCarouselSection(section: section, compactTop: isFirstAfterHero),
      'FLASH_SALE' => FlashSaleHomeSection(section: section, compactTop: isFirstAfterHero),
      'FEATURED_BRANDS' || 'BRAND_SHOWCASE' => BrandHomeSection(section: section, compactTop: isFirstAfterHero),
      'PACKAGES' => PackagesHomeSection(section: section, compactTop: isFirstAfterHero),
      'PROMO_STRIP' => PromoStripSection(section: section),
      'IMAGE_TILES' => ImageTilesSection(section: section),
      'IMAGE_MARQUEE' => ImageMarqueeSection(section: section),
      'CIRCLE_TILES' => CircleTilesSection(section: section),
      'ROUTINE_CAROUSEL' => RoutineCarouselSection(section: section, compactTop: isFirstAfterHero),
      'CARE_HUB' => CareHubSection(section: section, compactTop: isFirstAfterHero),
      'SKIN_CONCERNS' => SkinConcernsStrip(
          concerns: section.skinConcerns,
          title: section.title,
          subtitle: section.subtitle,
          display: section.display ?? section.layout ?? 'chips',
          showTitle: section.showTitle,
        ),
      _ => const SizedBox.shrink(),
    };

    final top = sectionPadding(
      section.paddingTop?.toDouble(),
      _topSpacing(section.type, isFirstAfterHero),
    );
    final bottom = sectionPadding(section.paddingBottom?.toDouble(), 0);

    return RepaintBoundary(
      child: Padding(
        padding: EdgeInsets.only(top: top, bottom: bottom),
        child: child,
      ),
    );
  }

  double _topSpacing(String type, bool compact) {
    if (type == 'PROMO_STRIP') return HomeTheme.compactGap;
    if (compact) return HomeTheme.compactGap;
    return HomeTheme.sectionGap;
  }
}

/// ترتيب الأقسام حسب لوحة التحكم (position).
List<HomeSection> _orderedSections(List<HomeSection> sections) {
  final copy = List<HomeSection>.from(sections);
  copy.sort((a, b) => a.position.compareTo(b.position));
  return copy;
}

bool _isDuplicateCategorySection(String type) =>
    type == 'CATEGORY_GRID' ||
    type == 'CATEGORY_TILES' ||
    type == 'MAKEUP_CATEGORIES';

List<Widget> buildHomeSections(HomeFeed feed) {
  if (feed.sections.isEmpty) return _legacySections(feed);

  final widgets = <Widget>[];
  var heroHasCategories = false;
  var seenHero = false;
  var firstAfterHero = true;

  var index = 0;
  for (final s in _orderedSections(feed.sections)) {
    if (s.type == 'HERO_BANNER') {
      heroHasCategories = s.categories.isNotEmpty;
      seenHero = true;
      firstAfterHero = false;
      widgets.add(HomeSectionEntrance(
        index: index++,
        child: HomeSectionWidget(section: s),
      ));
      continue;
    }

    // تجنّب تكرار شبكة الفئات إذا ظهرت أسفل البنر
    if (heroHasCategories && _isDuplicateCategorySection(s.type)) continue;

    widgets.add(HomeSectionEntrance(
      index: index++,
      child: HomeSectionWidget(
        section: s,
        isFirstAfterHero: seenHero && firstAfterHero,
      ),
    ));
    if (seenHero) firstAfterHero = false;
  }

  return widgets;
}

List<Widget> _legacySections(HomeFeed feed) {
  var i = 0;
  Widget wrap(Widget w) => HomeSectionEntrance(index: i++, child: w);
  return [
    if (feed.banners.isNotEmpty || feed.categories.isNotEmpty)
      wrap(HeroHomeSection(
        section: HomeSection(
          id: 'legacy-hero',
          type: 'HERO_BANNER',
          banners: feed.banners,
          categories: feed.categories,
        ),
      )),
    if (feed.skinConcerns.isNotEmpty)
      wrap(SkinConcernsStrip(concerns: feed.skinConcerns, title: 'دليل البشرة', showTitle: true)),
    if (feed.flashSale.products.isNotEmpty)
      wrap(FlashSaleHomeSection(
        section: HomeSection(
          id: 'legacy-flash',
          type: 'FLASH_SALE',
          title: 'أقوى العروض',
          showTitle: true,
          products: feed.flashSale.products,
          endsAt: feed.flashSale.endsAt,
          viewAllQuery: 'isPromo=1&title=أقوى العروض',
        ),
        compactTop: true,
      )),
    if (feed.bestSellers.isNotEmpty)
      wrap(ProductCarouselSection(
        section: HomeSection(
          id: 'legacy-best',
          type: 'PRODUCT_LIST',
          title: 'الأكثر مبيعاً',
          showTitle: true,
          products: feed.bestSellers,
          viewAllQuery: 'isBestSeller=1&title=الأكثر مبيعاً',
        ),
      )),
    if (feed.brands.isNotEmpty)
      wrap(BrandHomeSection(
        section: HomeSection(
          id: 'legacy-brands',
          type: 'FEATURED_BRANDS',
          title: 'العلامات التجارية',
          showTitle: true,
          brands: feed.brands,
        ),
      )),
    if (feed.newArrivals.isNotEmpty)
      wrap(ProductCarouselSection(
        section: HomeSection(
          id: 'legacy-new',
          type: 'PRODUCT_LIST',
          title: 'وصل حديثاً',
          showTitle: true,
          products: feed.newArrivals,
          viewAllQuery: 'isNew=1&title=وصل حديثاً',
        ),
      )),
    if (feed.featured.isNotEmpty)
      wrap(ProductCarouselSection(
        section: HomeSection(
          id: 'legacy-featured',
          type: 'PRODUCT_LIST',
          title: 'منتجات مختارة',
          showTitle: true,
          products: feed.featured,
          viewAllQuery: 'isFeatured=1&title=منتجات مختارة',
        ),
      )),
  ];
}
