import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../data/models/home_feed.dart';
import 'offers_theme.dart';

/// رأس صفحة العروض — بسيط وأنيق.
class OffersHero extends StatelessWidget {
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
  Widget build(BuildContext context) {
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
                      Text('العروض', style: OffersTheme.display(size: 26)),
                      const SizedBox(height: 2),
                      Text(
                        promoCount > 0
                            ? '$promoCount+ منتج بأسعار مخفّضة'
                            : 'اكتشفي أقوى التخفيضات على منتجاتنا',
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
                    label: 'كل العروض',
                    selected: true,
                    onTap: () => context.push('/products?isPromo=1&title=كل العروض'),
                  ),
                  const SizedBox(width: 8),
                  _QuickChip(
                    label: 'الأكثر مبيعاً',
                    onTap: () => context.push('/products?isBestSeller=1&title=الأكثر مبيعاً'),
                  ),
                  const SizedBox(width: 8),
                  _QuickChip(
                    label: 'وصل حديثاً',
                    onTap: () => context.push('/products?isNew=1&title=وصل حديثاً'),
                  ),
                  if (flashSale != null && flashSale!.products.isNotEmpty) ...[
                    const SizedBox(width: 8),
                    _QuickChip(
                      label: 'عرض سريع',
                      icon: Icons.bolt_rounded,
                      onTap: () => context.push('/products?isPromo=1&title=العرض السريع'),
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

class OffersPerksRow extends StatelessWidget {
  const OffersPerksRow({super.key});

  static const _items = [
    (Icons.verified_outlined, 'أصلية 100%'),
    (Icons.local_shipping_outlined, 'توصيل سريع'),
    (Icons.replay_rounded, 'استبدال سهل'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, 8),
      child: Row(
        children: [
          for (var i = 0; i < _items.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 9),
                decoration: OffersTheme.sectionDecoration(),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(_items[i].$1, size: 14, color: OffersTheme.accent),
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        _items[i].$2,
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
