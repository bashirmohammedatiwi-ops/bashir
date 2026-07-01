import 'package:flutter/material.dart';

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
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
        child: GestureDetector(
          onTap: () => openBannerLink(context, b),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: AspectRatio(
              aspectRatio: 2.1,
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
    final count = columns == 2 ? 2 : 3;
    final banners = list.take(count).toList();

    return HomeSectionShell(
      section: section,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
        child: Row(
          children: [
            for (int i = 0; i < banners.length; i++) ...[
              if (i > 0) const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => openBannerLink(context, banners[i]),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: AspectRatio(
                      aspectRatio: columns == 2 ? 0.72 : 0.62,
                      child: _BannerContent(banner: banners[i]),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
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
    return HomeSectionShell(
      section: section,
      child: SizedBox(
        height: 148,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
          itemCount: list.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) {
            final b = list[i];
            return GestureDetector(
              onTap: () => openBannerLink(context, b),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(
                  width: 280,
                  child: _BannerContent(banner: b),
                ),
              ),
            );
          },
        ),
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
                child: Text(banner.discountText!,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
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
