import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/support_links.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../../auth/auth_provider.dart';
import '../../catalog/catalog_providers.dart';
import '../../profile/profile_providers.dart';
import '../home_link.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_banner_stage.dart';
import '../widgets/home_category_grid.dart';
import '../widgets/home_quick_dock.dart';
import '../widgets/home_theme.dart';

/// رأس الصفحة — بنر Floating Stage + اختصارات.
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
    final topPad = MediaQuery.paddingOf(context).top;
    final cats = _normalizeCategories(widget.section.categories);
    final banners = widget.section.banners;
    final feed = ref.watch(homeFeedProvider).valueOrNull;
    final whatsapp = feed?.settings.whatsapp;
    final auth = ref.watch(authProvider);
    final unread =
        auth.isAuthenticated ? ref.watch(unreadNotificationsCountProvider) : 0;

    return ColoredBox(
      color: HomeTheme.canvas,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(
              HomeTheme.paddingH,
              topPad + 4,
              HomeTheme.paddingH,
              0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _TopActions(
                  unread: unread,
                  whatsapp: whatsapp,
                  onNotifications: () => context.push('/notifications'),
                ),
                const SizedBox(height: 10),
                _GreetingRow(storeName: feed?.settings.storeName),
                const SizedBox(height: 10),
                _SearchBar(
                  onSearch: () => context.push('/search'),
                  onScan: () => context.push('/scan'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _HeroBannerCarousel(
            section: widget.section,
            banners: banners,
            index: _bannerIndex,
            onChanged: (i) => setState(() => _bannerIndex = i),
          ),
          const HomeQuickDock(),
          HomeTrustStrip(freeShippingThreshold: feed?.settings.freeShippingThreshold),
          if (cats.isNotEmpty) ...[
            const SizedBox(height: 8),
            HomeHeroCategoryStrip(categories: cats),
          ],
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

  @override
  Widget build(BuildContext context) {
    if (banners.isEmpty) {
      return HomeBannerStage.fromSection(
        banner: const AppBanner(id: 'default'),
        section: section,
        onTap: () => context.push('/products?isFeatured=1'),
      );
    }

    if (banners.length == 1) {
      return HomeBannerStage.fromSection(
        banner: banners.first,
        section: section,
        sceneIndex: 0,
        onTap: () => openBannerLink(context, banners.first),
      );
    }

    final h = homeHeroBannerHeight(context, section: section);

    return Column(
      children: [
        CarouselSlider(
          options: CarouselOptions(
            height: h,
            viewportFraction: 1,
            autoPlay: true,
            autoPlayInterval: const Duration(seconds: 5),
            autoPlayAnimationDuration: const Duration(milliseconds: 900),
            autoPlayCurve: Curves.easeOutCubic,
            onPageChanged: (i, _) => onChanged(i),
          ),
          items: banners.asMap().entries.map((e) {
            return HomeBannerStage.fromSection(
              banner: e.value,
              section: section,
              index: e.key,
              sceneIndex: e.key,
              onTap: () => openBannerLink(context, e.value),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        AnimatedSmoothIndicator(
          activeIndex: index,
          count: banners.length,
          effect: ExpandingDotsEffect(
            dotHeight: 6,
            dotWidth: 6,
            expansionFactor: 3,
            spacing: 6,
            activeDotColor: HomeTheme.sage,
            dotColor: HomeTheme.sage.withValues(alpha: 0.25),
          ),
        ),
      ],
    );
  }
}

class _GreetingRow extends StatelessWidget {
  final String? storeName;

  const _GreetingRow({this.storeName});

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'صباح الخير'
        : hour < 17
            ? 'مساء الخير'
            : 'مساء النور';
    final name = (storeName ?? '').trim();

    return Row(
      children: [
        Text(greeting, style: HomeTheme.sectionTitle(size: 17)),
        if (name.isNotEmpty) ...[
          const Spacer(),
          Text(
            name,
            style: HomeTheme.body(size: 11, color: HomeTheme.inkMuted, weight: FontWeight.w600),
          ),
        ],
      ],
    );
  }
}

class _TopActions extends StatelessWidget {
  final int unread;
  final String? whatsapp;
  final VoidCallback onNotifications;

  const _TopActions({
    required this.unread,
    required this.whatsapp,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        HomeTapScale(
          onTap: onNotifications,
          child: _RoundAction(icon: Icons.notifications_none_rounded, badge: unread),
        ),
        const Spacer(),
        if (whatsapp != null && whatsapp!.isNotEmpty)
          HomeTapScale(
            onTap: () => openWhatsApp(whatsapp, message: 'مرحباً، أحتاج مساعدة'),
            child: const _RoundAction(
              icon: Icons.chat_rounded,
              iconColor: Color(0xFF25D366),
            ),
          ),
      ],
    );
  }
}

class _RoundAction extends StatelessWidget {
  final IconData icon;
  final Color? iconColor;
  final int badge;

  const _RoundAction({required this.icon, this.iconColor, this.badge = 0});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: HomeTheme.surface,
        shape: BoxShape.circle,
        border: Border.all(color: HomeTheme.surfaceMuted.withValues(alpha: 0.8)),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          Icon(icon, size: 20, color: iconColor ?? HomeTheme.ink),
          if (badge > 0)
            Positioned(
              top: 0,
              left: 0,
              child: PulseBadge(
                child: Container(
                  width: 14,
                  height: 14,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: AppColors.sale,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    badge > 9 ? '9+' : '$badge',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 7,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  final VoidCallback onSearch;
  final VoidCallback onScan;

  const _SearchBar({required this.onSearch, required this.onScan});

  @override
  Widget build(BuildContext context) {
    return HomeTapScale(
      onTap: onSearch,
      child: Container(
        height: 44,
        decoration: HomeTheme.pillSurface(),
        padding: const EdgeInsets.symmetric(horizontal: 14),
        child: Row(
          children: [
            Icon(Icons.search_rounded, size: 19, color: HomeTheme.inkMuted),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'ابحثي عن منتج أو براند…',
                style: HomeTheme.body(size: 13, color: HomeTheme.inkMuted),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            HomeTapScale(
              onTap: onScan,
              child: Icon(Icons.qr_code_scanner_rounded, size: 20, color: HomeTheme.sage),
            ),
          ],
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
