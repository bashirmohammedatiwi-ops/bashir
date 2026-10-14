import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/app_search_scan_bar.dart';
import '../../../data/models/home_feed.dart';
import '../../worlds/world_theme.dart';
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
    final t = context.worldTheme;

    return Padding(
      padding: EdgeInsets.fromLTRB(OffersTheme.hPad, topPad + 6, OffersTheme.hPad, 10),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
        decoration: OffersTheme.heroDecoration(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        OffersTheme.sale,
                        Color.lerp(OffersTheme.sale, t.accentDark, 0.35)!,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
                    boxShadow: [
                      BoxShadow(
                        color: OffersTheme.sale.withValues(alpha: 0.3),
                        blurRadius: 12,
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
                      Text(s.offersTitle, style: OffersTheme.title(context, size: 21)),
                      const SizedBox(height: 3),
                      Text(s.discoverBestDeals, style: OffersTheme.body(context, size: 12.5)),
                    ],
                  ),
                ),
                // شارة نسبة — هوية العروض بلون التخفيض.
                if (flashSale != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: OffersTheme.sale.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(color: OffersTheme.sale.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.bolt_rounded, size: 13, color: OffersTheme.sale),
                        const SizedBox(width: 3),
                        Text(
                          s.flashSale,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: OffersTheme.sale,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            AppSearchScanBar(
              hint: s.searchHintHome,
              scanLabel: s.scan,
              fillColor: t.surface.withValues(alpha: 0.92),
              borderColor: t.accentSoft,
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

  const _Chip({required this.label, required this.onTap}) : selected = false;

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
          decoration: OffersTheme.chipDecoration(context, selected: selected),
          child: Text(label, style: OffersTheme.chip(context, selected: selected)),
        ),
      ),
    );
  }
}
