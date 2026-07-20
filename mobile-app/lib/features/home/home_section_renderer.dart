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
import 'sections/media_gallery_section.dart';
import 'sections/section_group_section.dart';
import 'sections/promo_sections.dart';
import 'sections/skin_concerns_strip.dart';
import 'widgets/home_animations.dart';
import 'widgets/home_theme.dart';

export 'sections/hero_section.dart' show HeroHomeSection;

class HomeSectionWidget extends ConsumerWidget {
  final HomeSection section;
  final bool isFirstAfterHero;
  final bool nestedInGroup;

  const HomeSectionWidget({
    super.key,
    required this.section,
    this.isFirstAfterHero = false,
    this.nestedInGroup = false,
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
      'MEDIA_GALLERY' => MediaGallerySection(section: section),
      'SECTION_GROUP' => SectionGroupSection(section: section, compactTop: isFirstAfterHero),
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

    if (nestedInGroup) return RepaintBoundary(child: child);

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

HomeSection _fixedHeroSection(HomeFeed feed) {
  HomeSection? cmsHero;
  for (final s in _orderedSections(feed.sections)) {
    if (s.type == 'HERO_BANNER') {
      cmsHero = s;
      break;
    }
  }

  final banners = cmsHero?.banners.isNotEmpty == true
      ? cmsHero!.banners
      : feed.banners;
  final categories = cmsHero?.categories.isNotEmpty == true
      ? cmsHero!.categories
      : feed.categories;

  return HomeSection(
    id: cmsHero?.id ?? 'fixed-hero',
    type: 'HERO_BANNER',
    position: -1,
    banners: banners,
    categories: categories,
  );
}

List<HomeSection> _cmsSections(HomeFeed feed) {
  return _orderedSections(feed.sections)
      .where((s) => s.type != 'HERO_BANNER')
      .toList();
}

List<Widget> buildHomeSections(HomeFeed feed) {
  final widgets = <Widget>[];
  var index = 0;

  // الرأس + البنرات + الاختصارات + أيقونات الفئات — ثابتة دائماً
  final fixedHero = _fixedHeroSection(feed);
  final heroHasCategories = fixedHero.categories.isNotEmpty;
  widgets.add(HomeSectionEntrance(
    index: index++,
    child: HeroHomeSection(section: fixedHero),
  ));

  final cms = _cmsSections(feed);
  if (cms.isEmpty) {
    return widgets;
  }

  var firstAfterHero = true;
  for (final s in cms) {
    // تجنّب تكرار شبكة الفئات إذا الهيرو يعرض فئات
    if (heroHasCategories && _isDuplicateCategorySection(s.type)) continue;

    widgets.add(HomeSectionEntrance(
      index: index++,
      child: HomeSectionWidget(
        section: s,
        isFirstAfterHero: firstAfterHero,
      ),
    ));
    firstAfterHero = false;
  }

  return widgets;
}
