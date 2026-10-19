import 'dart:math' as math;

import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/theme/ad_slots.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_banner_stage.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';
import '../../worlds/world_theme.dart';

List<AppBanner> sectionBanners(HomeSection section) {
  if (section.banners.isNotEmpty) return section.banners;
  return section.items
      .whereType<Map>()
      .map((e) => AppBanner.fromJson(Map<String, dynamic>.from(e)))
      .toList();
}

/// وجهة اللمس — بلا رابط لا حركة ضغط ولا دور «زر» (كان البنر يهتز ولا يفتح شيئاً).
VoidCallback? _bannerTap(BuildContext context, AppBanner banner) =>
    banner.hasLink ? () => openBannerLink(context, banner) : null;

/// تسمية البنر لقارئ الشاشة — العنوان من اللوحة أو «إعلان»، ودور «زر» فقط إن كان له رابط.
class _BannerSemantics extends ConsumerWidget {
  final AppBanner banner;
  final Widget child;

  const _BannerSemantics({required this.banner, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageCodeProvider);
    return Semantics(
      button: banner.hasLink,
      image: true,
      label: banner.titleForLang(lang) ?? ref.watch(stringsProvider).homeMediaPromotion,
      child: child,
    );
  }
}

/// بنر كامل — صورة نقية بلا أي كتابة، بإطار ناعم وظل خفيف بلون العالم.
/// يحترم نسبة الشريحة من اللوحة حتى سقف ارتفاع (62% من عرض الشاشة)؛ التصاميم الأقرب للمربع
/// تُعرض كاملة (contain) فوق نسخة مموّهة منها بلون العالم — لا قصّ للنص أو السعر.
class BannerFullSection extends ConsumerWidget {
  final HomeSection section;
  const BannerFullSection({super.key, required this.section});

  /// أقل من هذه النسبة تُعتبر الصورة «طويلة» فتُعرض كاملة بدل القصّ.
  static const _containBelowAspect = 2.0;

  /// سقف الارتفاع نسبةً إلى عرض الشاشة.
  static const _maxHeightFactor = 0.62;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = sectionBanners(section);
    if (list.isEmpty) return const SizedBox.shrink();
    final banner = list.first;
    final onTap = _bannerTap(context, banner);

    if (!banner.hasImage) {
      return HomeSectionShell(
        section: section,
        wrapCard: false,
        child: _BannerSemantics(
          banner: banner,
          child: HomeBannerStage.fromSection(banner: banner, section: section, onTap: onTap),
        ),
      );
    }

    final t = context.worldTheme;
    final layout = resolveBannerLayout(section);
    final screenW = MediaQuery.sizeOf(context).width;
    final padH = layout.fullBleed ? 0.0 : HomeTheme.paddingH;
    final radius = layout.fullBleed ? 0.0 : layout.radius;
    final width = screenW - padH * 2;
    final aspect = layout.aspect > 0 ? layout.aspect : HomeTheme.bannerAspect;
    final height = math.min(width / aspect, screenW * _maxHeightFactor);
    final contain = aspect < _containBelowAspect;

    final Widget image = contain
        ? Stack(
            fit: StackFit.expand,
            children: [
              // خلفية: نفس الصورة مكبّرة من 24 بكسل فتبدو مموّهة — بلا ImageFiltered
              // (ضبابية sigma 22 تُحسب كل إطار وهي أثقل شيء في الرئيسية)، ومصبوغة بلون العالم.
              AppNetworkImage(
                url: banner.imageUrl,
                fit: BoxFit.cover,
                decodeWidth: 24,
                filterQuality: FilterQuality.medium,
                backgroundColor: t.accentLight,
              ),
              ColoredBox(color: t.accent.withValues(alpha: 0.14)),
              AppNetworkImage(
                url: banner.imageUrl,
                fit: BoxFit.contain,
                width: width,
                height: height,
              ),
            ],
          )
        : AppNetworkImage(
            url: banner.imageUrl,
            fit: BoxFit.cover,
            width: width,
            height: height,
            backgroundColor: t.accentLight,
          );

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: padH, vertical: 8),
      child: _BannerSemantics(
        banner: banner,
        child: HomeTapScale(
          onTap: onTap,
          child: Container(
            width: width,
            height: height,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(radius),
              boxShadow: layout.fullBleed
                  ? null
                  : [
                      BoxShadow(
                        color: t.accentDark.withValues(alpha: 0.12),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                        spreadRadius: -6,
                      ),
                    ],
            ),
            clipBehavior: Clip.antiAlias,
            foregroundDecoration: layout.fullBleed
                ? null
                : BoxDecoration(
                    borderRadius: BorderRadius.circular(radius),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                  ),
            child: image,
          ),
        ),
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
    const gap = 10.0;
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
              child: _BannerSemantics(
                banner: banners[0],
                child: HomeBannerStage.fromSection(
                  banner: banners[0],
                  section: section,
                  index: 0,
                  width: leftW,
                  sceneIndex: 0,
                  onTap: _bannerTap(context, banners[0]),
                ),
              ),
            ),
          ),
          const SizedBox(width: gap),
          Expanded(
            flex: 42,
            child: HomeStaggerItem(
              index: 1,
              child: _BannerSemantics(
                banner: banners[1],
                child: HomeBannerStage.fromSection(
                  banner: banners[1],
                  section: section,
                  index: 1,
                  width: rightW,
                  sceneIndex: 1,
                  onTap: _bannerTap(context, banners[1]),
                ),
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
          if (i > 0) const SizedBox(width: gap),
          Expanded(
            child: HomeStaggerItem(
              index: i,
              child: _BannerSemantics(
                banner: banners[i],
                child: HomeBannerStage.fromSection(
                  banner: banners[i],
                  section: section,
                  index: i,
                  width: itemW,
                  sceneIndex: i,
                  onTap: _bannerTap(context, banners[i]),
                ),
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
    const gap = 8.0;
    final pad = sectionLayout.fullBleed ? 0.0 : HomeTheme.paddingH * 2;
    final totalW = MediaQuery.sizeOf(context).width - pad;
    final itemW = (totalW - gap * 2) / 3;

    return Row(
      children: [
        for (var i = 0; i < banners.length; i++) ...[
          if (i > 0) const SizedBox(width: gap),
          Expanded(
            child: HomeStaggerItem(
              index: i,
              child: _BannerSemantics(
                banner: banners[i],
                child: HomeBannerStage.fromSection(
                  banner: banners[i],
                  section: section,
                  index: i,
                  width: itemW,
                  sceneIndex: i,
                  onTap: _bannerTap(context, banners[i]),
                ),
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

    final t = context.worldTheme;
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
              // «تقليل الحركة»: لا تقليب تلقائي.
              autoPlay: list.length > 1 && !MediaQuery.disableAnimationsOf(context),
              autoPlayInterval: const Duration(seconds: 4),
              onPageChanged: (i, _) => setState(() => _index = i),
            ),
            items: list.asMap().entries.map((e) {
              return _BannerSemantics(
                banner: e.value,
                child: HomeBannerStage.fromSection(
                  banner: e.value,
                  section: widget.section,
                  index: e.key,
                  sceneIndex: e.key,
                  width: cardW,
                  onTap: _bannerTap(context, e.value),
                ),
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
                activeDotColor: t.accent,
                dotColor: t.accent.withValues(alpha: 0.22),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
