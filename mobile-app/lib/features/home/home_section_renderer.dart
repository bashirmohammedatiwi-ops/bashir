import 'package:flutter/material.dart';

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
import 'sections/image_marquee_section.dart';
import 'sections/photo_wall_section.dart';
import 'sections/section_group_section.dart';
import 'sections/promo_sections.dart';
import 'widgets/home_theme.dart';
import '../beauty/beauty_home_sections.dart';

export 'sections/hero_section.dart' show HeroHomeSection;

class HomeSectionWidget extends StatelessWidget {
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
  Widget build(BuildContext context) {
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
      'PRODUCT_LIST' =>
        section.layout == 'film'
            ? ProductFilmStripSection(
                section: section,
                compactTop: isFirstAfterHero,
              )
            : ProductCarouselSection(
                section: section,
                compactTop: isFirstAfterHero,
              ),
      'FLASH_SALE' => FlashSaleHomeSection(
        section: section,
        compactTop: isFirstAfterHero,
      ),
      'FEATURED_BRANDS' || 'BRAND_SHOWCASE' => BrandHomeSection(
        section: section,
        compactTop: isFirstAfterHero,
      ),
      'PACKAGES' => PackagesShowcaseSection(
        section: section,
        compactTop: isFirstAfterHero,
      ),
      'PROMO_STRIP' => PromoStripSection(section: section),
      'IMAGE_TILES' => ImageTilesSection(section: section),
      'IMAGE_MARQUEE' => ImageMarqueeSection(section: section),
      'MEDIA_GALLERY' ||
      'PHOTO_WALL' ||
      'IMAGE_COLLAGE' => PhotoWallSection(section: section),
      'SECTION_GROUP' => SectionGroupSection(
        section: section,
        compactTop: isFirstAfterHero,
      ),
      'CIRCLE_TILES' => CircleTilesSection(section: section),
      'ROUTINE_CAROUSEL' => RoutinesHomeSection(
        section: section,
        compactTop: isFirstAfterHero,
      ),
      'CARE_HUB' => CareHubSection(
        section: section,
        compactTop: isFirstAfterHero,
      ),
      'SKIN_CONCERNS' => SkinGuideHomeSection(
        section: section,
        compactTop: isFirstAfterHero,
      ),
      _ => const SizedBox.shrink(),
    };

    if (nestedInGroup) return RepaintBoundary(child: child);

    // المجموعة تطبّق حشوتها من لوحة التحكم داخل إطارها — لا نضاعفها هنا.
    final group = section.type == 'SECTION_GROUP';
    final top = group
        ? _topSpacing(section.type, isFirstAfterHero)
        : sectionPadding(
            section.paddingTop?.toDouble(),
            _topSpacing(section.type, isFirstAfterHero),
          );
    final bottom = group
        ? 0.0
        : sectionPadding(section.paddingBottom?.toDouble(), 0);

    return RepaintBoundary(
      child: Padding(
        padding: EdgeInsets.only(top: top, bottom: bottom),
        child: child,
      ),
    );
  }

  double _topSpacing(String type, bool compact) {
    if (type == 'PROMO_STRIP') return HomeTheme.compactGap;
    if (compact) return 10;
    return HomeTheme.sectionGap * 0.65;
  }
}

/// ترتيب الأقسام حسب لوحة التحكم (position).
List<HomeSection> _orderedSections(List<HomeSection> sections) {
  final copy = List<HomeSection>.from(sections);
  copy.sort((a, b) => a.position.compareTo(b.position));
  return copy;
}

/// هل القسم يحتوي محتوى ظاهر؟ (احتياط عند الكاش القديم)
bool isHomeSectionVisible(HomeSection section) {
  if (section.type == 'PROMO_STRIP') {
    return section.promoStrip?.hasContent ?? false;
  }
  if (section.type == 'SECTION_GROUP') {
    return section.children.isNotEmpty;
  }
  return section.banners.isNotEmpty ||
      section.categories.isNotEmpty ||
      section.products.isNotEmpty ||
      section.brands.isNotEmpty ||
      section.packages.isNotEmpty ||
      section.skinConcerns.isNotEmpty ||
      section.items.isNotEmpty;
}

/// هل يُعرض القسم في الرئيسية؟ نفس القاعدة للأقسام وأبناء المجموعات:
/// - شريط العبارة البسيط (PROMO_STRIP بنمط strip) أُزيل من الرئيسية عمداً، أما
///   «الأخبار» و«الشريط المتحرك» فتُعرض.
/// - شبكة/بطاقات أقسام لم تُنتقَ يدوياً (كلها من أقسام الواجهة الافتراضية) تكرار لشريط
///   أقسام الرأس — تُخفى. المنتقاة يدوياً و«أقسام المكياج» تُعرض دائماً.
/// - مجموعة كل أبنائها مخفيون لا تظهر كإطار فارغ.
bool shouldShowHomeSection(HomeSection s, {Set<String>? heroCategoryIds}) {
  if (!isHomeSectionVisible(s)) return false;
  if (s.type == 'PROMO_STRIP' &&
      (s.promoStrip?.variant ?? 'strip') == 'strip') {
    return false;
  }
  if ((s.type == 'CATEGORY_GRID' || s.type == 'CATEGORY_TILES') &&
      heroCategoryIds != null &&
      heroCategoryIds.isNotEmpty &&
      s.categories.every((c) => heroCategoryIds.contains(c.id))) {
    return false;
  }
  if (s.type == 'SECTION_GROUP') {
    return s.children.any(
      (c) => shouldShowHomeSection(c, heroCategoryIds: heroCategoryIds),
    );
  }
  return true;
}

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

  final parentCategories = categories.where((c) => c.parentId == null).toList();
  final heroCategories = parentCategories.isNotEmpty
      ? parentCategories
      : categories;

  return HomeSection(
    id: cmsHero?.id ?? 'fixed-hero',
    type: 'HERO_BANNER',
    position: -1,
    banners: banners,
    categories: heroCategories,
  );
}

/// أقسام الواجهة الافتراضية التي يكررها شريط أقسام الرأس — null إن لم يعرض الرأس أقساماً.
Set<String>? homeHeroCategoryIds(HomeFeed feed) {
  final hero = _fixedHeroSection(feed);
  if (hero.categories.isEmpty) return null;
  return {
    ...feed.categories.map((c) => c.id),
    ...hero.categories.map((c) => c.id),
  };
}

List<HomeSection> _cmsSections(HomeFeed feed) {
  return _orderedSections(
    feed.sections,
  ).where((s) => s.type != 'HERO_BANNER').toList();
}

/// نوع فتحة في قائمة الرئيسية: الرأس، قسم من لوحة التحكم، أو رفّ شخصي/تلقائي
/// يُبنى كسولاً في فتحته الخاصة.
enum HomeSlotKind {
  hero,
  cms,
  flashSale,
  cart,
  coupons,
  routine,
  buyAgain,
  continueShopping,
  wishlist,
  needs,
  brands,
  budget,
  gift,
  promise,
}

/// فتحة قسم واحدة — للبناء الكسول في SliverList.
class HomeSectionSlot {
  final HomeSection section;
  final HomeSlotKind kind;
  final bool isFirstAfterHero;

  const HomeSectionSlot({
    required this.section,
    this.kind = HomeSlotKind.cms,
    this.isFirstAfterHero = false,
  });

  bool get isHero => kind == HomeSlotKind.hero;

  /// مفتاح ثابت للفتحة (لا يتكرر بين الرفوف الشخصية والأقسام).
  String get key => kind == HomeSlotKind.cms ? section.id : 'home-${kind.name}';
}

HomeSectionSlot _personal(HomeSlotKind kind) => HomeSectionSlot(
  section: HomeSection(id: 'home-${kind.name}', type: 'PERSONAL'),
  kind: kind,
);

/// تلي الرأس مباشرة: ما يخصّ زيارتها الحالية.
const _leadShelves = [
  HomeSlotKind.cart,
  HomeSlotKind.coupons,
  HomeSlotKind.buyAgain,
];

/// تتخلّل أقسام لوحة التحكم بعد أول قسم — رفّ بعد كل قسم، والباقي في الآخر.
const _interleavedShelves = [
  HomeSlotKind.continueShopping,
  HomeSlotKind.needs,
  HomeSlotKind.routine,
  HomeSlotKind.wishlist,
  HomeSlotKind.brands,
  HomeSlotKind.budget,
  HomeSlotKind.promise,
  HomeSlotKind.gift,
];

/// عرض سريع تلقائي من feed.flashSale (كما في الموقع) حين لا يضيف المشرف قسماً له.
HomeSection? _autoFlashSale(HomeFeed feed, DateTime now) {
  final flash = feed.flashSale;
  final endsAt = flash.endsAt;
  if (flash.products.isEmpty || endsAt == null || !endsAt.isAfter(now)) {
    return null;
  }
  if (feed.sections.any((s) => s.type == 'FLASH_SALE')) return null;
  return HomeSection(
    id: 'auto-flash-sale',
    type: 'FLASH_SALE',
    products: flash.products,
    endsAt: endsAt,
  );
}

/// يحسب أقسام الرئيسية بدون بناء الـ widgets مسبقاً.
///
/// [personal] (واجهة عالم): الرفوف الشخصية فتحات مستقلة — السلة والكوبونات و«اطلبيها
/// مجدداً» بعد الرأس، والبقية بين أقسام لوحة التحكم حتى لا تدفعها شاشات للأسفل.
List<HomeSectionSlot> resolveHomeSectionSlots(
  HomeFeed feed, {
  bool personal = false,
  DateTime? now,
}) {
  final slots = <HomeSectionSlot>[];
  final heroIds = homeHeroCategoryIds(feed);

  slots.add(
    HomeSectionSlot(section: _fixedHeroSection(feed), kind: HomeSlotKind.hero),
  );
  if (personal) slots.addAll(_leadShelves.map(_personal));

  final flash = _autoFlashSale(feed, now ?? DateTime.now());
  if (flash != null) {
    slots.add(HomeSectionSlot(section: flash, kind: HomeSlotKind.flashSale));
  }

  final later = personal ? [..._interleavedShelves] : <HomeSlotKind>[];
  var firstAfterHero = true;
  for (final s in _cmsSections(feed)) {
    if (!shouldShowHomeSection(s, heroCategoryIds: heroIds)) continue;
    slots.add(
      HomeSectionSlot(
        section: s,
        isFirstAfterHero: firstAfterHero && flash == null,
      ),
    );
    firstAfterHero = false;
    if (later.isNotEmpty) slots.add(_personal(later.removeAt(0)));
  }
  slots.addAll(later.map(_personal));

  return slots;
}

/// أقسام صفحة العروض — بدون رأس الرئيسية الثابت.
List<HomeSectionSlot> resolveOffersSectionSlots(HomeFeed feed) {
  final slots = <HomeSectionSlot>[];
  var firstAfterHero = true;
  for (final s in _orderedSections(feed.sections)) {
    if (!isHomeSectionVisible(s)) continue;
    final isHero = s.type == 'HERO_BANNER';
    slots.add(
      HomeSectionSlot(
        section: s,
        kind: isHero ? HomeSlotKind.hero : HomeSlotKind.cms,
        isFirstAfterHero: !isHero && firstAfterHero,
      ),
    );
    if (!isHero) firstAfterHero = false;
  }
  return slots;
}
