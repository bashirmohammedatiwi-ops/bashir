import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../data/models/home_feed.dart';
import 'offers_theme.dart';

/// رأس بسيط — عنوان واضح وفلاتر خفيفة.
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
      padding: EdgeInsets.fromLTRB(OffersTheme.hPad, topPad + 8, OffersTheme.hPad, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.offersTitle, style: OffersTheme.title(size: 22)),
                    const SizedBox(height: 4),
                    Text(
                      promoCount > 0
                          ? s.promoProductsCount(promoCount)
                          : s.discoverBestDeals,
                      style: OffersTheme.body(size: 13),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: () {
                  HapticFeedback.selectionClick();
                  context.push('/search');
                },
                icon: const Icon(Icons.search_rounded, color: OffersTheme.brand, size: 24),
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 36,
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: OffersTheme.chipDecoration(selected: selected),
          child: Text(label, style: OffersTheme.chip(selected: selected)),
        ),
      ),
    );
  }
}
