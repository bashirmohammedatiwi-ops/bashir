import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/theme/ad_slots.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_banner_stage.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

List<AppBanner> sectionBanners(HomeSection section) {
  if (section.banners.isNotEmpty) return section.banners;
  return section.items
      .whereType<Map>()
      .map((e) => AppBanner.fromJson(Map<String, dynamic>.from(e)))
      .toList();
}

class BannerFullSection extends StatelessWidget {
  final HomeSection section;
  const BannerFullSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final list = sectionBanners(section);
    if (list.isEmpty) return const SizedBox.shrink();

    return HomeSectionShell(
      section: section,
      wrapCard: false,
      child: HomeBannerStage.fromSection(
        banner: list.first,
        section: section,
        onTap: () => openBannerLink(context, list.first),
      ),
    );
  }
}

class BannerGridSection extends StatelessWidget {
  final HomeSection section;
  final int columns;
  const BannerGridSection({super.key, required this.section, required this.columns});

  @override
  Widget build(BuildContext context) {
    final list = sectionBanners(section);
    if (list.isEmpty) return const SizedBox.shrink();

    final layout = resolveBannerLayout(section);
    final horizontalPad = layout.fullBleed ? 0.0 : HomeTheme.paddingH;

    return HomeSectionShell(
      section: section,
      wrapCard: false,
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: horizontalPad),
        child: columns >= 3
            ? _TripleRow(banners: list.take(3).toList(), section: section)
            : _PairRow(banners: list.take(2).toList(), section: section),
      ),
    );
  }
}

class _PairRow extends StatelessWidget {
  final List<AppBanner> banners;
  final HomeSection section;
  const _PairRow({required this.banners, required this.section});

  @override
  Widget build(BuildContext context) {
    final sectionLayout = section.sectionLayout;
    final asymmetric = sectionLayout == 'asymmetric';
    final gap = 10.0;
    final pad = resolveBannerLayout(section).fullBleed ? 0.0 : HomeTheme.paddingH * 2;
    final totalW = MediaQuery.sizeOf(context).width - pad;

    if (asymmetric && banners.length >= 2) {
      final leftW = (totalW - gap) * 0.58;
      final rightW = (totalW - gap) * 0.42;
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 58,
            child: HomeStaggerItem(
              index: 0,
              child: HomeBannerStage.fromSection(
                banner: banners[0],
                section: section,
                index: 0,
                width: leftW,
                sceneIndex: 0,
                onTap: () => openBannerLink(context, banners[0]),
              ),
            ),
          ),
          SizedBox(width: gap),
          Expanded(
            flex: 42,
            child: HomeStaggerItem(
              index: 1,
              child: HomeBannerStage.fromSection(
                banner: banners[1],
                section: section,
                index: 1,
                width: rightW,
                sceneIndex: 1,
                onTap: () => openBannerLink(context, banners[1]),
              ),
            ),
          ),
        ],
      );
    }

    final itemW = (totalW - gap) / 2;

    return Row(
      children: [
        for (var i = 0; i < banners.length; i++) ...[
          if (i > 0) SizedBox(width: gap),
          Expanded(
            child: HomeStaggerItem(
              index: i,
              child: HomeBannerStage.fromSection(
                banner: banners[i],
                section: section,
                index: i,
                width: itemW,
                sceneIndex: i,
                onTap: () => openBannerLink(context, banners[i]),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _TripleRow extends StatelessWidget {
  final List<AppBanner> banners;
  final HomeSection section;
  const _TripleRow({required this.banners, required this.section});

  @override
  Widget build(BuildContext context) {
    final sectionLayout = resolveBannerLayout(section);
    final gap = 8.0;
    final pad = sectionLayout.fullBleed ? 0.0 : HomeTheme.paddingH * 2;
    final totalW = MediaQuery.sizeOf(context).width - pad;
    final itemW = (totalW - gap * 2) / 3;

    return Row(
      children: [
        for (var i = 0; i < banners.length; i++) ...[
          if (i > 0) SizedBox(width: gap),
          Expanded(
            child: HomeStaggerItem(
              index: i,
              child: HomeBannerStage.fromSection(
                banner: banners[i],
                section: section,
                index: i,
                width: itemW,
                sceneIndex: i,
                onTap: () => openBannerLink(context, banners[i]),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class BannerCarouselSection extends StatefulWidget {
  final HomeSection section;
  const BannerCarouselSection({super.key, required this.section});

  @override
  State<BannerCarouselSection> createState() => _BannerCarouselSectionState();
}

class _BannerCarouselSectionState extends State<BannerCarouselSection> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final list = sectionBanners(widget.section);
    if (list.isEmpty) return const SizedBox.shrink();

    final layout = resolveBannerLayout(widget.section);
    final viewport = layout.fullBleed ? 1.0 : 0.88;
    final cardW = MediaQuery.sizeOf(context).width * viewport;
    final cardH = layout.heightFor(cardW);

    return HomeSectionShell(
      section: widget.section,
      wrapCard: false,
      child: Column(
        children: [
          CarouselSlider(
            options: CarouselOptions(
              height: cardH,
              viewportFraction: viewport,
              enlargeCenterPage: !layout.fullBleed,
              enlargeFactor: layout.fullBleed ? 0 : 0.04,
              autoPlay: list.length > 1,
              autoPlayInterval: const Duration(seconds: 4),
              onPageChanged: (i, _) => setState(() => _index = i),
            ),
            items: list.asMap().entries.map((e) {
              return HomeBannerStage.fromSection(
                banner: e.value,
                section: widget.section,
                index: e.key,
                sceneIndex: e.key,
                width: cardW,
                onTap: () => openBannerLink(context, e.value),
              );
            }).toList(),
          ),
          if (list.length > 1) ...[
            const SizedBox(height: 10),
            AnimatedSmoothIndicator(
              activeIndex: _index,
              count: list.length,
              effect: ExpandingDotsEffect(
                dotHeight: 5,
                dotWidth: 5,
                expansionFactor: 3,
                spacing: 5,
                activeDotColor: HomeTheme.sage,
                dotColor: HomeTheme.sage.withValues(alpha: 0.25),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
