import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/l10n/locale_provider.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/brand.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_animations.dart';
import '../widgets/home_scroll_perf.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';
import '../../worlds/world_theme.dart';

class BrandHomeSection extends ConsumerWidget {
  final HomeSection section;
  final bool compactTop;
  const BrandHomeSection({super.key, required this.section, this.compactTop = false});

  bool get _cardsLayout => section.layout == 'cards' || section.type == 'BRAND_SHOWCASE';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (section.brands.isEmpty) return const SizedBox.shrink();
    final s = ref.s;

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: section.showViewAll ? s.viewAll : null,
      onAction: section.showViewAll
          ? () => openViewAllLink(context, query: section.viewAllQuery, fallbackQuery: '/brands')
          : null,
      child: _cardsLayout
          ? _BrandCardsRow(brands: section.brands)
          : _BrandLogosRow(brands: section.brands),
    );
  }
}

/// بلاطة براند — شعار أو أول حرف من الاسم، بتسمية واحدة لقارئ الشاشة.
class _BrandTile extends StatelessWidget {
  final Brand brand;
  final String name;
  final Widget child;

  const _BrandTile({required this.brand, required this.name, required this.child});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: name,
      child: ExcludeSemantics(
        child: HomeTapScale(onTap: () => openBrandLink(context, brand), child: child),
      ),
    );
  }
}

/// شعار البراند، أو أول حرف من اسمه إن لم يوجد شعار.
class _BrandMark extends StatelessWidget {
  final Brand brand;
  final String name;
  final double size;
  final double letterSize;

  const _BrandMark({
    required this.brand,
    required this.name,
    required this.size,
    required this.letterSize,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return SizedBox(
      width: size,
      height: size,
      child: brand.logoUrl.isNotEmpty
          ? AppNetworkImage(url: brand.logoUrl, fit: BoxFit.contain, width: size, height: size)
          : Center(
              child: Text(
                name.isEmpty ? '' : name.characters.first,
                style: HomeTheme.sectionTitle(size: letterSize, color: t.accentDark),
              ),
            ),
    );
  }
}

class _BrandLogosRow extends ConsumerWidget {
  final List<Brand> brands;
  const _BrandLogosRow({required this.brands});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final fallback = ref.s.homeMediaBrand;
    return SizedBox(
      height: 72,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        cacheExtent: HomeScrollPerf.horizontalCacheExtent,
        addAutomaticKeepAlives: false,
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        itemCount: brands.length,
        separatorBuilder: (_, __) => const SizedBox(width: HomeTheme.itemGap),
        itemBuilder: (_, i) {
          final b = brands[i];
          final name = b.localizedName(lang);
          return HomeStaggerItem(
            index: i,
            child: _BrandTile(
              brand: b,
              name: name.isEmpty ? fallback : name,
              child: Container(
                width: 112,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: t.surface,
                  borderRadius: BorderRadius.circular(HomeTheme.radiusCard),
                  border: Border.all(color: t.divider),
                ),
                child: Row(
                  children: [
                    _BrandMark(brand: b, name: name, size: 32, letterSize: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: HomeTheme.chipLabel.copyWith(fontSize: 11, color: t.ink),
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

class _BrandCardsRow extends ConsumerWidget {
  final List<Brand> brands;
  const _BrandCardsRow({required this.brands});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.worldTheme;
    final lang = ref.watch(languageCodeProvider);
    final fallback = ref.s.homeMediaBrand;
    return SizedBox(
      height: 120,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        cacheExtent: HomeScrollPerf.horizontalCacheExtent,
        addAutomaticKeepAlives: false,
        padding: const EdgeInsets.symmetric(horizontal: HomeTheme.paddingH),
        itemCount: brands.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final b = brands[i];
          final name = b.localizedName(lang);
          return HomeStaggerItem(
            index: i,
            child: _BrandTile(
              brand: b,
              name: name.isEmpty ? fallback : name,
              child: Container(
                width: 100,
                decoration: BoxDecoration(
                  color: t.surface,
                  borderRadius: BorderRadius.circular(HomeTheme.radiusCard),
                  border: Border.all(color: t.divider),
                ),
                padding: const EdgeInsets.all(10),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _BrandMark(brand: b, name: name, size: 44, letterSize: 18),
                    const SizedBox(height: 6),
                    Text(
                      name,
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: HomeTheme.circleLabel.copyWith(color: t.inkSoft),
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
