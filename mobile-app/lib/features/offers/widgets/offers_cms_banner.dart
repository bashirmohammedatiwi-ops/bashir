import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/ad_slots.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/models/home_section.dart';
import '../../home/home_link.dart';
import '../../home/widgets/home_banner_stage.dart';
import 'offers_theme.dart';

/// بنرات CMS لصفحة العروض.
class OffersCmsBanner extends StatefulWidget {
  final HomeSection section;

  const OffersCmsBanner({super.key, required this.section});

  @override
  State<OffersCmsBanner> createState() => _OffersCmsBannerState();
}

class _OffersCmsBannerState extends State<OffersCmsBanner> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final banners = widget.section.banners;
    if (banners.isEmpty) return const SizedBox.shrink();

    final inset = AppSpacing.lg;
    final width = MediaQuery.sizeOf(context).width - inset * 2;

    return Padding(
      padding: EdgeInsets.fromLTRB(inset, 4, inset, 10),
      child: Container(
        decoration: OffersTheme.sectionDecoration(),
        padding: const EdgeInsets.all(8),
        child: Column(
          children: [
            if (banners.length == 1)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: HomeBannerStage.fromSection(
                  banner: banners.first,
                  section: widget.section,
                  width: width - 16,
                  onTap: () => openBannerLink(context, banners.first),
                ),
              )
            else
              Column(
                children: [
                  CarouselSlider.builder(
                    itemCount: banners.length,
                    options: CarouselOptions(
                      height: resolveBannerLayout(widget.section, index: 0).heightFor(width - 16),
                      viewportFraction: 1,
                      enlargeCenterPage: false,
                      autoPlay: banners.length > 1,
                      autoPlayInterval: const Duration(seconds: 5),
                      onPageChanged: (i, _) => setState(() => _index = i),
                    ),
                    itemBuilder: (_, i, __) {
                      final b = banners[i];
                      return ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: HomeBannerStage.fromSection(
                          banner: b,
                          section: widget.section,
                          index: i,
                          width: width - 16,
                          onTap: () => openBannerLink(context, b),
                        ),
                      );
                    },
                  ),
                  if (banners.length > 1) ...[
                    const SizedBox(height: 8),
                    AnimatedSmoothIndicator(
                      activeIndex: _index,
                      count: banners.length,
                      effect: ExpandingDotsEffect(
                        dotHeight: 5,
                        dotWidth: 5,
                        activeDotColor: OffersTheme.accent,
                        dotColor: OffersTheme.inkMuted.withValues(alpha: 0.35),
                      ),
                    ),
                  ],
                ],
              ),
          ],
        ),
      ),
    );
  }
}

/// إطار خفيف حول أقسام CMS.
class OffersSectionFrame extends StatelessWidget {
  final Widget child;

  const OffersSectionFrame({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: 4),
      decoration: OffersTheme.sectionDecoration(),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(OffersTheme.cardRadius),
        child: child,
      ),
    );
  }
}

class OffersCatalogHeader extends ConsumerWidget {
  final int loadedCount;
  final bool loading;

  const OffersCatalogHeader({
    super.key,
    required this.loadedCount,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 20, AppSpacing.lg, 10),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 30,
            decoration: OffersTheme.accentBarDecoration(),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.offerProducts, style: OffersTheme.title(size: 18)),
                Text(
                  loading
                      ? s.loading
                      : loadedCount > 0
                          ? s.productsAvailableNow(loadedCount)
                          : s.noOffersNow,
                  style: OffersTheme.body(size: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
