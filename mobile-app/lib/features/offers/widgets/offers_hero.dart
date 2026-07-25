import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/models/home_feed.dart';
import 'offers_theme.dart';

/// رأس صفحة العروض — بسيط وأنيق.
class OffersHero extends ConsumerWidget {
  final double topPad;
  final int promoCount;
  final FlashSale? flashSale;

  const OffersHero({
    super.key,
    required this.topPad,
    this.promoCount = 0,
    this.flashSale,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return Padding(
      padding: EdgeInsets.fromLTRB(AppSpacing.lg, topPad + 10, AppSpacing.lg, 12),
      child: Container(
        decoration: OffersTheme.headerDecoration(),
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 4,
                  height: 28,
                  decoration: OffersTheme.accentBarDecoration(),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.offersTitle, style: OffersTheme.display(size: 26)),
                      const SizedBox(height: 2),
                      Text(
                        promoCount > 0
                            ? s.promoProductsCount(promoCount)
                            : s.discoverBestDeals,
                        style: OffersTheme.body(size: 12),
                      ),
                    ],
                  ),
                ),
                _RoundAction(
                  icon: Icons.search_rounded,
                  onTap: () => context.push('/search'),
                ),
              ],
            ),
            const SizedBox(height: 14),
            SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _QuickChip(
                    label: s.allOffers,
                    selected: true,
                    onTap: () => context.push('/products?isPromo=1&title=${Uri.encodeComponent(s.allOffers)}'),
                  ),
                  const SizedBox(width: 8),
                  _QuickChip(
                    label: s.sortPopular,
                    onTap: () => context.push('/products?isBestSeller=1&title=${Uri.encodeComponent(s.sortPopular)}'),
                  ),
                  const SizedBox(width: 8),
                  _QuickChip(
                    label: s.newArrivals,
                    onTap: () => context.push('/products?isNew=1&title=${Uri.encodeComponent(s.newArrivals)}'),
                  ),
                  if (flashSale != null && flashSale!.products.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    _QuickChip(
                      label: s.flashSale,
                      icon: Icons.bolt_rounded,
                      onTap: () => context.push('/products?isPromo=1&title=${Uri.encodeComponent(s.flashSale)}'),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class OffersPerksRow extends ConsumerWidget {
  const OffersPerksRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final items = [
      (Icons.verified_outlined, s.authentic100Short),
      (Icons.local_shipping_outlined, s.fastDelivery),
      (Icons.replay_rounded, s.easyReturns),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, 8),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 9),
                decoration: OffersTheme.sectionDecoration(),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(items[i].$1, size: 14, color: OffersTheme.accent),
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        items[i].$2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: OffersTheme.body(size: 10, weight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _RoundAction extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _RoundAction({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: OffersTheme.accentSoft,
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 40,
          height: 40,
          child: Icon(icon, size: 20, color: OffersTheme.accent),
        ),
      ),
    );
  }
}

class _QuickChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final bool selected;
  final VoidCallback onTap;

  const _QuickChip({
    required this.label,
    this.icon,
    this.selected = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: OffersTheme.chipDecoration(selected: selected),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 14, color: selected ? Colors.white : OffersTheme.accent),
                const SizedBox(width: 4),
              ],
              Text(label, style: OffersTheme.chip(selected: selected)),
            ],
          ),
        ),
      ),
    );
  }
}
