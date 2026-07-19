import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../../shell/main_shell.dart';
import '../home_link.dart';
import '../widgets/home_animations.dart';

const _kBannerHeightFactor = 0.38;
const _kCategoryOverlap = 52.0;

/// ارتفاع صف الفئات: دائرة 60 + نص + مسافات
const _kCategoryRowH = 96.0;

class HeroHomeSection extends ConsumerStatefulWidget {
  final HomeSection section;
  const HeroHomeSection({super.key, required this.section});

  @override
  ConsumerState<HeroHomeSection> createState() => _HeroHomeSectionState();
}

class _HeroHomeSectionState extends ConsumerState<HeroHomeSection> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.paddingOf(context).top;
    final bannerH = MediaQuery.sizeOf(context).height * _kBannerHeightFactor + topPad;
    final cats = _normalizeCategories(widget.section.categories);
    final gridH = categoryGridHeight(cats.length);
    final heroH = bannerH + gridH - _kCategoryOverlap;
    final banners = widget.section.banners;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
      child: SizedBox(
        height: heroH,
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: [
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: bannerH,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
                child: banners.isNotEmpty
                    ? _BannerStack(
                        banners: banners,
                        height: bannerH,
                        index: _index,
                        onChanged: (i) => setState(() => _index = i),
                      )
                    : _DefaultBanner(height: bannerH),
              ),
            ),
            Positioned(
              left: 0,
              right: 0,
              top: bannerH - 28,
              height: gridH + 32,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: const [0.0, 0.35, 0.7, 1.0],
                    colors: [
                      Colors.white.withValues(alpha: 0),
                      AppColors.homeGradientTop.withValues(alpha: 0.55),
                      AppColors.homeGradientMid.withValues(alpha: 0.96),
                      AppColors.homeGradientMid,
                    ],
                  ),
                ),
              ),
            ),
            if (cats.isNotEmpty)
              Positioned(
                left: 0,
                right: 0,
                top: bannerH - _kCategoryOverlap,
                height: gridH,
                child: QuickCategoryGrid(categories: cats),
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

double categoryGridHeight(int count) {
  if (count <= 0) return 0;
  return _kCategoryRowH;
}

class _BannerStack extends StatelessWidget {
  final List<AppBanner> banners;
  final double height;
  final int index;
  final ValueChanged<int> onChanged;
  const _BannerStack({
    required this.banners,
    required this.height,
    required this.index,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        CarouselSlider(
          options: CarouselOptions(
            height: height,
            viewportFraction: 1,
            autoPlay: banners.length > 1,
            autoPlayInterval: const Duration(seconds: 5),
            autoPlayAnimationDuration: const Duration(milliseconds: 900),
            onPageChanged: (i, _) => onChanged(i),
          ),
          items: [
            for (final b in banners)
              GestureDetector(
                onTap: () => openBannerLink(context, b),
                child: _BannerTile(banner: b, height: height),
              ),
          ],
        ),
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.2,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.black.withValues(alpha: 0.2), Colors.transparent],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: height * 0.24,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.transparent, AppColors.homeGradientTop.withValues(alpha: 0.45), AppColors.homeGradientMid],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ),
        if (banners.length > 1)
          Positioned(
            bottom: 64,
            left: 0,
            right: 0,
            child: Center(
              child: AnimatedSmoothIndicator(
                activeIndex: index,
                count: banners.length,
                effect: ExpandingDotsEffect(
                  dotHeight: 7,
                  dotWidth: 7,
                  expansionFactor: 3.2,
                  spacing: 6,
                  activeDotColor: AppColors.primary,
                  dotColor: Colors.white.withValues(alpha: 0.65),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _BannerTile extends StatelessWidget {
  final AppBanner banner;
  final double height;
  const _BannerTile({required this.banner, required this.height});

  @override
  Widget build(BuildContext context) {
    final screenW = MediaQuery.sizeOf(context).width;
    if (banner.hasImage) {
      return KenBurnsImage(
        child: AppNetworkImage(
          url: banner.imageUrl,
          width: screenW,
          height: height,
          fit: BoxFit.cover,
        ),
      );
    }
    return Container(
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            parseHexColor(banner.backgroundColor) ?? AppColors.primary,
            AppColors.primaryDark,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
    );
  }
}

class _DefaultBanner extends StatelessWidget {
  final double height;
  const _DefaultBanner({required this.height});
  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(gradient: AppColors.primaryGradient),
    );
  }
}

/// صف أفقي واحد للفئات + «الكل».
class QuickCategoryGrid extends ConsumerWidget {
  final List<Category> categories;
  const QuickCategoryGrid({super.key, required this.categories});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: _kCategoryRowH,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        itemCount: categories.length + 1,
        separatorBuilder: (_, __) => const SizedBox(width: 4),
        itemBuilder: (context, i) {
          if (i == categories.length) {
            return _SeeAllCategory(
              onTap: () => ref.read(navIndexProvider.notifier).state = 1,
            );
          }
          final c = categories[i];
          return _QuickCat(
            category: c,
            onTap: () => openSectionLink(
              context,
              linkType: c.linkType,
              linkValue: c.linkValue,
              legacyLink: c.link ?? '/products?categoryId=${c.id}&title=${Uri.encodeComponent(c.name)}',
            ),
          );
        },
      ),
    );
  }
}

IconData _categoryFallbackIcon(String slug) {
  if (slug.contains('makeup') || slug.contains('maki')) return Icons.brush_outlined;
  if (slug.contains('perfume') || slug.contains('fragrance')) return Icons.local_florist_outlined;
  if (slug.contains('hair')) return Icons.content_cut_outlined;
  if (slug.contains('skin')) return Icons.spa_outlined;
  if (slug.contains('device') || slug.contains('tool')) return Icons.devices_other_outlined;
  return Icons.category_outlined;
}

class _QuickCat extends StatefulWidget {
  final Category category;
  final VoidCallback onTap;
  const _QuickCat({required this.category, required this.onTap});

  @override
  State<_QuickCat> createState() => _QuickCatState();
}

class _QuickCatState extends State<_QuickCat> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 80,
      child: GestureDetector(
        onTapDown: (_) => setState(() => _pressed = true),
        onTapUp: (_) => setState(() => _pressed = false),
        onTapCancel: () => setState(() => _pressed = false),
        onTap: widget.onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedScale(
          scale: _pressed ? 0.92 : 1,
          duration: const Duration(milliseconds: 120),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 62,
                height: 62,
                decoration: BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primaryLight, width: 2.5),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.16),
                      blurRadius: 16,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: _CategoryAvatar(category: widget.category),
              ),
              const SizedBox(height: 6),
              Text(
                widget.category.name,
                maxLines: 2,
                textAlign: TextAlign.center,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  height: 1.15,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SeeAllCategory extends StatelessWidget {
  final VoidCallback onTap;
  const _SeeAllCategory({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 80,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.28),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.grid_view_rounded, color: Colors.white, size: 24),
            ),
            const SizedBox(height: 6),
            const Text(
              'الكل',
              maxLines: 1,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                height: 1.15,
                color: AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryAvatar extends StatelessWidget {
  final Category category;
  const _CategoryAvatar({required this.category});

  @override
  Widget build(BuildContext context) {
    if (category.imageUrl.isNotEmpty) {
      return AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover);
    }
    final emoji = category.icon?.trim();
    if (emoji != null && emoji.isNotEmpty) {
      return Center(child: Text(emoji, style: const TextStyle(fontSize: 26, height: 1)));
    }
    return Icon(
      _categoryFallbackIcon(category.slug),
      color: const Color(0xFF888888),
      size: 26,
    );
  }
}

class CategoryGridSection extends StatelessWidget {
  final HomeSection section;
  const CategoryGridSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final cats = _normalizeCategories(section.categories);
    if (cats.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 4, 0, 0),
      child: QuickCategoryGrid(categories: cats),
    );
  }
}
