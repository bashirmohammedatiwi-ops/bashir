import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/nice_one_header.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../../shell/main_shell.dart';
import '../home_link.dart';

const _kBannerHeightFactor = 0.36;
const _kCategoryOverlap = 48.0;

/// ارتفاع صف الفئات: دائرة 56 + نص + مسافات
const _kCategoryRowH = 88.0;

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
              child: banners.isNotEmpty
                  ? _BannerStack(
                      banners: banners,
                      height: bannerH,
                      index: _index,
                      onChanged: (i) => setState(() => _index = i),
                    )
                  : _DefaultBanner(height: bannerH),
            ),
            Positioned(top: topPad, left: 0, right: 0, child: const NiceOneHeader()),
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
                      Colors.white.withValues(alpha: 0.55),
                      Colors.white.withValues(alpha: 0.96),
                      Colors.white,
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
            // امتداد أبيض أسفل الفئات لانتقال نظيف
            Positioned(
              left: 0,
              right: 0,
              top: bannerH + gridH - _kCategoryOverlap,
              bottom: 0,
              child: const ColoredBox(color: Colors.white),
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
  return out.take(8).toList();
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
                colors: [Colors.transparent, Colors.white.withValues(alpha: 0.5), Colors.white],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ),
        if (banners.length > 1)
          Positioned(
            bottom: 56,
            left: 0,
            right: 0,
            child: Center(
              child: AnimatedSmoothIndicator(
                activeIndex: index,
                count: banners.length,
                effect: ExpandingDotsEffect(
                  dotHeight: 6,
                  dotWidth: 6,
                  expansionFactor: 3.5,
                  spacing: 5,
                  activeDotColor: const Color(0xFF555555),
                  dotColor: Colors.white.withValues(alpha: 0.55),
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
      return AppNetworkImage(
        url: banner.imageUrl,
        width: screenW,
        height: height,
        fit: BoxFit.cover,
      );
    }
    return Container(
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            parseHexColor(banner.backgroundColor) ?? const Color(0xFF7EC8E3),
            const Color(0xFF5BB5E5),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
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
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF7EC8E3), Color(0xFF90EE90)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
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
            onTap: () => context.push(
              '/products?categoryId=${c.id}&title=${Uri.encodeComponent(c.name)}',
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

class _QuickCat extends StatelessWidget {
  final Category category;
  final VoidCallback onTap;
  const _QuickCat({required this.category, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 76,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: _CategoryAvatar(category: category),
            ),
            const SizedBox(height: 5),
            Text(
              category.name,
              maxLines: 2,
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, height: 1.15),
            ),
          ],
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
      width: 76,
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F8),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFE8E8EE)),
              ),
              alignment: Alignment.center,
              child: const Icon(Icons.grid_view_rounded, color: Color(0xFF888888), size: 22),
            ),
            const SizedBox(height: 5),
            const Text(
              'الكل',
              maxLines: 1,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, height: 1.15),
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
    return ColoredBox(
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(0, 8, 0, 4),
        child: QuickCategoryGrid(categories: cats),
      ),
    );
  }
}
