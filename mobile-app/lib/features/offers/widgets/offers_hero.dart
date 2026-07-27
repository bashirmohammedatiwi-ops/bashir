import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_search_scan_bar.dart';
import '../../../data/models/home_feed.dart';
import 'offers_theme.dart';

/// رأس صفحة العروض — أنيق بدون عدادات.
class OffersHero extends ConsumerWidget {
  final double topPad;
  final FlashSale? flashSale;

  const OffersHero({
    super.key,
    required this.topPad,
    this.flashSale,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;

    return Padding(
      padding: EdgeInsets.fromLTRB(OffersTheme.hPad, topPad + 6, OffersTheme.hPad, 10),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
        decoration: OffersTheme.heroDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.25),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.local_offer_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.offersTitle, style: OffersTheme.title(size: 21)),
                      const SizedBox(height: 3),
                      Text(s.discoverBestDeals, style: OffersTheme.body(size: 12.5)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            AppSearchScanBar(
              hint: s.searchHintHome,
              scanLabel: s.scan,
              fillColor: Colors.white.withValues(alpha: 0.92),
              borderColor: AppColors.primarySoft,
              onSearchTap: () => context.push('/search'),
              onScanTap: () => context.push('/scan'),
            ),
            const SizedBox(height: 14),
            SizedBox(
              height: 34,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _Chip(
                    label: s.allOffers,
                    selected: true,
                    onTap: () => context.push('/products?isPromo=1&title=${Uri.encodeComponent(s.allOffers)}'),
                  ),
                  const SizedBox(width: 8),
                  _Chip(
                    label: s.sortPopular,
                    onTap: () => context.push('/products?isBestSeller=1&title=${Uri.encodeComponent(s.sortPopular)}'),
                  ),
                  const SizedBox(width: 8),
                  _Chip(
                    label: s.newArrivals,
                    onTap: () => context.push('/products?isNew=1&title=${Uri.encodeComponent(s.newArrivals)}'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _Chip({required this.label, this.selected = false, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: OffersTheme.chipDecoration(selected: selected),
          child: Text(label, style: OffersTheme.chip(selected: selected)),
        ),
      ),
    );
  }
}
