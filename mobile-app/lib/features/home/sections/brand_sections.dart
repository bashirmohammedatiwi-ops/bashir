import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/home_section.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class BrandHomeSection extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  const BrandHomeSection({
    super.key,
    required this.section,
    this.compactTop = false,
  });

  bool get _cardsLayout =>
      section.layout == 'cards' || section.type == 'BRAND_SHOWCASE';

  @override
  Widget build(BuildContext context) {
    if (section.brands.isEmpty) return const SizedBox.shrink();

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: section.showViewAll ? 'عرض الكل' : null,
      onAction: section.showViewAll ? () => context.push('/brands') : null,
      child: _cardsLayout ? _BrandCardsRow(brands: section.brands) : _BrandLogosRow(brands: section.brands),
    );
  }
}

class _BrandLogosRow extends StatelessWidget {
  final List<Brand> brands;
  const _BrandLogosRow({required this.brands});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 72,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        itemCount: brands.length,
        separatorBuilder: (_, __) => const SizedBox(width: HomeTheme.itemGap),
        itemBuilder: (_, i) {
          final b = brands[i];
          return HomeStaggerItem(
            index: i,
            child: HomeTapScale(
              onTap: () => context.push(
                '/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}',
              ),
              child: Container(
                width: 112,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: HomeTheme.sectionSurface(),
                child: Row(
                  children: [
                    SizedBox(
                      width: 32,
                      height: 32,
                      child: b.logoUrl.isNotEmpty
                          ? AppNetworkImage(url: b.logoUrl, fit: BoxFit.contain)
                          : Center(
                              child: Text(
                                b.name.characters.first,
                                style: HomeTheme.sectionTitle(size: 16),
                              ),
                            ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        b.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: HomeTheme.chipLabel.copyWith(fontSize: 10),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _BrandCardsRow extends StatelessWidget {
  final List<Brand> brands;
  const _BrandCardsRow({required this.brands});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        itemCount: brands.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final b = brands[i];
          return HomeStaggerItem(
            index: i,
            child: HomeTapScale(
              onTap: () => context.push(
                '/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}',
              ),
              child: Container(
                width: 100,
                decoration: HomeTheme.cardDecoration(),
                padding: const EdgeInsets.all(10),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      height: 44,
                      width: 44,
                      child: b.logoUrl.isNotEmpty
                          ? AppNetworkImage(url: b.logoUrl, fit: BoxFit.contain)
                          : Center(
                              child: Text(
                                b.name.characters.first,
                                style: HomeTheme.sectionTitle(size: 18),
                              ),
                            ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      b.name,
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: HomeTheme.circleLabel,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
