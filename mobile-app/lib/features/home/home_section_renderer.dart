import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/home_feed.dart';
import '../../data/models/home_section.dart';
import 'sections/banner_sections.dart';
import 'sections/brand_sections.dart';
import 'sections/category_sections.dart';
import 'sections/hero_section.dart';
import 'sections/product_sections.dart';
import 'sections/promo_sections.dart';

export 'sections/hero_section.dart' show HeroHomeSection;

/// يعرض قسماً واحداً من الصفحة الرئيسية حسب نوعه.
class HomeSectionWidget extends ConsumerWidget {
  final HomeSection section;
  const HomeSectionWidget({super.key, required this.section});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    switch (section.type) {
      case 'HERO_BANNER':
        return HeroHomeSection(section: section);
      case 'CATEGORY_GRID':
        return CategoryGridSection(section: section);
      case 'CATEGORY_TILES':
        return CategoryTilesSection(section: section);
      case 'MAKEUP_CATEGORIES':
        return MakeupCategoriesSection(section: section);
      case 'BANNER_FULL':
      case 'CUSTOM_BANNER':
        return BannerFullSection(section: section);
      case 'BANNER_GRID_2':
        return BannerGridSection(section: section, columns: 2);
      case 'BANNER_GRID_3':
        return BannerGridSection(section: section, columns: 3);
      case 'BANNER_CAROUSEL':
        return BannerCarouselSection(section: section);
      case 'PRODUCT_LIST':
        return ProductCarouselSection(section: section);
      case 'FLASH_SALE':
        return FlashSaleHomeSection(section: section);
      case 'FEATURED_BRANDS':
      case 'BRAND_SHOWCASE':
        return BrandHomeSection(section: section);
      case 'PACKAGES':
        return PackagesHomeSection(section: section);
      case 'PROMO_STRIP':
        return PromoStripSection(section: section);
      default:
        return const SizedBox.shrink();
    }
  }
}

/// يبني قائمة أقسام من API أو fallback للتخطيط القديم.
List<Widget> buildHomeSections(HomeFeed feed) {
  if (feed.sections.isNotEmpty) {
    return [
      for (final s in feed.sections) HomeSectionWidget(section: s),
      const SizedBox(height: 24),
    ];
  }
  return _legacySections(feed);
}

List<Widget> _legacySections(HomeFeed feed) {
  return [
    if (feed.banners.isNotEmpty || feed.categories.isNotEmpty)
      HeroHomeSection(
        section: HomeSection(
          id: 'legacy-hero',
          type: 'HERO_BANNER',
          banners: feed.banners,
          categories: feed.categories,
        ),
      ),
    if (feed.flashSale.products.isNotEmpty)
      FlashSaleHomeSection(
        section: HomeSection(
          id: 'legacy-flash',
          type: 'FLASH_SALE',
          title: 'أقوى العروض',
          products: feed.flashSale.products,
          endsAt: feed.flashSale.endsAt,
          viewAllQuery: 'isPromo=1&title=أقوى العروض',
        ),
      ),
    if (feed.bestSellers.isNotEmpty)
      ProductCarouselSection(
        section: HomeSection(
          id: 'legacy-best',
          type: 'PRODUCT_LIST',
          title: 'الأكثر مبيعاً',
          products: feed.bestSellers,
          viewAllQuery: 'isBestSeller=1&title=الأكثر مبيعاً',
        ),
      ),
    if (feed.newArrivals.isNotEmpty)
      ProductCarouselSection(
        section: HomeSection(
          id: 'legacy-new',
          type: 'PRODUCT_LIST',
          title: 'وصل حديثاً',
          products: feed.newArrivals,
          viewAllQuery: 'isNew=1&title=وصل حديثاً',
        ),
      ),
    if (feed.brands.isNotEmpty)
      BrandHomeSection(
        section: HomeSection(
          id: 'legacy-brands',
          type: 'FEATURED_BRANDS',
          title: 'العلامات التجارية',
          brands: feed.brands,
        ),
      ),
    if (feed.featured.isNotEmpty)
      ProductCarouselSection(
        section: HomeSection(
          id: 'legacy-featured',
          type: 'PRODUCT_LIST',
          title: 'منتجات مختارة',
          products: feed.featured,
          viewAllQuery: 'isFeatured=1&title=منتجات مختارة',
        ),
      ),
    const SizedBox(height: 24),
  ];
}
