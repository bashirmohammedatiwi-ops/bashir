import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/banner.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_section_shell.dart';

List<AppBanner> sectionBanners(HomeSection section) {
  if (section.banners.isNotEmpty) return section.banners;
  return section.items
      .whereType<Map>()
      .map((e) => AppBanner.fromJson(Map<String, dynamic>.from(e)))
      .toList();
}

double _bannerAspect(AppBanner b, HomeSection section) =>
    cardSizeSpec(b.cardSize ?? section.cardSize).bannerAspect;

class BannerFullSection extends StatelessWidget {
  final HomeSection section;
  const BannerFullSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final list = sectionBanners(section);
    if (list.isEmpty) return const SizedBox.shrink();
    final b = list.first;
    return HomeSectionShell(
      section: section,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
        child: GestureDetector(
          onTap: () => openBannerLink(context, b),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            child: AspectRatio(
              aspectRatio: _bannerAspect(b, section),
              child: _BannerContent(banner: b),
            ),
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
    final layout = section.sectionLayout ?? 'asymmetric';

    return HomeSectionShell(
      section: section,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
        child: layout == 'uniform'
            ? _UniformBannerRow(banners: list, section: section)
            : columns == 2
                ? _AsymmetricBannerPair(banners: list, section: section)
                : _TripleBannerRow(banners: list, section: section),
      ),
    );
  }
}

int _sizeFlex(String? cardSize) {
  final spec = cardSizeSpec(cardSize);
  return spec.width.clamp(88, 168).round();
}

class _UniformBannerRow extends StatelessWidget {
  final List<AppBanner> banners;
  final HomeSection section;

  const _UniformBannerRow({required this.banners, required this.section});

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        children: [
          for (var i = 0; i < banners.length; i++) ...[
            if (i > 0) const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _BannerTile(
                banner: banners[i],
                height: cardSizeSpec(banners[i].cardSize ?? section.cardSize).height,
                radius: AppRadius.md,
                onTap: () => openBannerLink(context, banners[i]),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AsymmetricBannerPair extends StatelessWidget {
  final List<AppBanner> banners;
  final HomeSection section;

  const _AsymmetricBannerPair({required this.banners, required this.section});

  @override
  Widget build(BuildContext context) {
    final a = banners[0];
    final b = banners.length > 1 ? banners[1] : null;
    final flexA = _sizeFlex(a.cardSize ?? section.cardSize);
    final flexB = b != null ? _sizeFlex(b.cardSize ?? section.cardSize) : 42;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            flex: flexA,
            child: _BannerTile(
              banner: a,
              radius: AppRadius.lg,
              onTap: () => openBannerLink(context, a),
            ),
          ),
          if (b != null) ...[
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: flexB,
              child: _BannerTile(
                banner: b,
                radius: AppRadius.md,
                onTap: () => openBannerLink(context, b),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TripleBannerRow extends StatelessWidget {
  final List<AppBanner> banners;
  final HomeSection section;

  const _TripleBannerRow({required this.banners, required this.section});

  @override
  Widget build(BuildContext context) {
    final items = banners.take(3).toList();
    final maxH = items
        .map((b) => cardSizeSpec(b.cardSize ?? section.cardSize).height)
        .fold(168.0, (a, b) => a > b ? a : b);

    return SizedBox(
      height: maxH,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const SizedBox(width: AppSpacing.sm),
            Expanded(
              flex: _sizeFlex(items[i].cardSize ?? section.cardSize),
              child: _BannerTile(
                banner: items[i],
                radius: AppRadius.md,
                onTap: () => openBannerLink(context, items[i]),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class BannerCarouselSection extends StatelessWidget {
  final HomeSection section;
  const BannerCarouselSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final list = sectionBanners(section);
    if (list.isEmpty) return const SizedBox.shrink();

    final maxH = list
        .map((b) => cardSizeSpec(b.cardSize ?? section.cardSize).height)
        .fold(148.0, (a, b) => a > b ? a : b);

    return HomeSectionShell(
      section: section,
      child: SizedBox(
        height: maxH + 20,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
          itemBuilder: (_, i) {
            final b = list[i];
            final spec = resolveItemCardSize(
              cardSize: b.cardSize,
              sectionLayout: section.sectionLayout,
              index: i,
              defaultSize: section.cardSize,
            );
            final w = spec.width > 0 ? spec.width : 280.0;
            return Align(
              alignment: Alignment.bottomCenter,
              child: GestureDetector(
                onTap: () => openBannerLink(context, b),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  child: SizedBox(
                    width: w,
                    height: spec.height,
                    child: _BannerContent(banner: b),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _BannerTile extends StatelessWidget {
  final AppBanner banner;
  final double radius;
  final double? height;
  final VoidCallback onTap;

  const _BannerTile({
    required this.banner,
    required this.radius,
    required this.onTap,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    final child = _BannerContent(banner: banner);
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: height != null ? SizedBox(height: height, child: child) : child,
      ),
    );
  }
}

class _BannerContent extends StatelessWidget {
  final AppBanner banner;
  const _BannerContent({required this.banner});

  @override
  Widget build(BuildContext context) {
    if (banner.hasImage) {
      return Stack(
        fit: StackFit.expand,
        children: [
          AppNetworkImage(url: banner.imageUrl, fit: BoxFit.cover),
          if (banner.discountText != null && banner.discountText!.isNotEmpty)
            Positioned(
              top: 10,
              right: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.92),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  banner.discountText!,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                ),
              ),
            ),
        ],
      );
    }
    return Container(
      color: parseHexColor(banner.backgroundColor) ?? const Color(0xFFE8F4FC),
      padding: const EdgeInsets.all(14),
      alignment: Alignment.bottomRight,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (banner.title != null)
            Text(banner.title!, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          if (banner.discountText != null)
            Text(banner.discountText!, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22)),
        ],
      ),
    );
  }
}
