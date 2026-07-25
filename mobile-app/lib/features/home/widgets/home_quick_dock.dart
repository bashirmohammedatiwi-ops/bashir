import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../shell/main_shell.dart';
import 'home_animations.dart';
import 'home_theme.dart';

class HomeQuickDock extends ConsumerWidget {
  const HomeQuickDock({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final items = [
      _Item(Icons.local_offer_outlined, s.quickOffers, () {
        ref.read(navIndexProvider.notifier).state = 2;
      }),
      _Item(Icons.grid_view_rounded, s.navCategories, () {
        ref.read(navIndexProvider.notifier).state = 1;
      }),
      _Item(Icons.storefront_outlined, s.quickBrands, () {
        context.push('/brands');
      }),
      _Item(Icons.favorite_border_rounded, s.quickWishlist, () {
        context.push('/wishlist');
      }),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 12, HomeTheme.paddingH, 0),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        decoration: HomeTheme.dockDecoration(),
        child: Row(
          children: [for (final item in items) Expanded(child: item)],
        ),
      ),
    );
  }
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _Item(this.icon, this.label, this.onTap);

  @override
  Widget build(BuildContext context) {
    return HomeTapScale(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: HomeTheme.pearl,
              shape: BoxShape.circle,
              border: Border.all(color: HomeTheme.divider),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 20, color: HomeTheme.accent),
          ),
          const SizedBox(height: 5),
          Text(
            label,
            style: HomeTheme.circleLabel.copyWith(fontSize: 10),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class HomeTrustStrip extends ConsumerWidget {
  final int? freeShippingThreshold;

  const HomeTrustStrip({super.key, this.freeShippingThreshold});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final threshold = freeShippingThreshold;
    final shipping = threshold != null && threshold > 0
        ? s.freeShippingPlus(_format(threshold))
        : s.fastDelivery;

    return Padding(
      padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 4, HomeTheme.paddingH, 8),
      child: Text(
        '${s.authentic}  ·  $shipping  ·  ${s.whatsappSupport}',
        textAlign: TextAlign.center,
        style: HomeTheme.body(size: 11, color: HomeTheme.inkMuted, weight: FontWeight.w500),
      ),
    );
  }

  static String _format(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}k';
    return '$n';
  }
}
