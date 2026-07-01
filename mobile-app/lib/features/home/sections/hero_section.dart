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

const _kBannerHeightFactor = 0.42;
const _kCategoryOverlap = 56.0;
const _kCategoryBlockH = 220.0;

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
    final heroH = bannerH + _kCategoryBlockH - _kCategoryOverlap;
    final banners = widget.section.banners;
    final categories = widget.section.categories;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
      child: SizedBox(
        height: heroH,
        child: Stack(
          clipBehavior: Clip.none,
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
              top: bannerH - 24,
              bottom: 0,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: const [0.0, 0.35, 1.0],
                    colors: [Colors.white.withValues(alpha: 0), Colors.white.withValues(alpha: 0.85), Colors.white],
                  ),
                ),
              ),
            ),
            if (categories.isNotEmpty)
              Positioned(
                left: 0,
                right: 0,
                top: bannerH - _kCategoryOverlap,
                child: _QuickCategoryGrid(categories: categories),
              ),
          ],
        ),
      ),
    );
  }
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
          height: height * 0.22,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.black.withValues(alpha: 0.22), Colors.transparent],
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
          height: height * 0.28,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.transparent, Colors.white.withValues(alpha: 0.45), Colors.white],
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
    if (banner.hasImage) {
      return AppNetworkImage(url: banner.imageUrl, height: height, fit: BoxFit.cover);
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
      padding: const EdgeInsets.fromLTRB(20, 80, 20, 90),
      alignment: Alignment.bottomRight,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (banner.subtitle != null && banner.subtitle!.isNotEmpty)
            Text(banner.subtitle!, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
          if (banner.title != null && banner.title!.isNotEmpty)
            Text(banner.title!, style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
        ],
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

class _QuickCategoryGrid extends ConsumerWidget {
  final List<Category> categories;
  const _QuickCategoryGrid({required this.categories});

  static const _icons = [
    Icons.percent_rounded,
    Icons.trending_up_rounded,
    Icons.spa_outlined,
    Icons.face_retouching_natural_outlined,
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = categories.take(8).toList();
    while (items.length < 8) {
      items.add(Category(id: 'p${items.length}', name: 'قسم', slug: ''));
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(6, 0, 6, 0),
      child: GridView.count(
        crossAxisCount: 4,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 8,
        crossAxisSpacing: 2,
        childAspectRatio: 0.74,
        children: [
          for (int i = 0; i < 8; i++)
            _QuickCat(
              name: items[i].name,
              imageUrl: items[i].imageUrl.isNotEmpty ? items[i].imageUrl : null,
              icon: items[i].imageUrl.isEmpty ? _icons[i % 4] : null,
              onTap: items[i].id.startsWith('p')
                  ? () => ref.read(navIndexProvider.notifier).state = i == 0 ? 2 : 1
                  : () => context.push(
                      '/products?categoryId=${items[i].id}&title=${Uri.encodeComponent(items[i].name)}'),
            ),
        ],
      ),
    );
  }
}

class _QuickCat extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final IconData? icon;
  final VoidCallback onTap;
  const _QuickCat({required this.name, this.imageUrl, this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.14), blurRadius: 14, offset: const Offset(0, 4))],
            ),
            clipBehavior: Clip.antiAlias,
            child: imageUrl != null
                ? AppNetworkImage(url: imageUrl!, fit: BoxFit.cover)
                : Icon(icon, color: const Color(0xFF888888), size: 26),
          ),
          const SizedBox(height: 7),
          Text(name, maxLines: 2, textAlign: TextAlign.center, overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class CategoryGridSection extends StatelessWidget {
  final HomeSection section;
  const CategoryGridSection({super.key, required this.section});
  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(6, 12, 6, 8),
        child: _QuickCategoryGrid(categories: section.categories),
      ),
    );
  }
}
