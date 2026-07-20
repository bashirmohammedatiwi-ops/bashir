import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../shell/main_shell.dart';
import 'home_animations.dart';
import 'home_theme.dart';

/// اختصارات سريعة — 4 أيقونات بسيطة.
class HomeQuickDock extends ConsumerWidget {
  const HomeQuickDock({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = [
      _Item(Icons.local_offer_outlined, 'العروض', AppColors.primary, () {
        ref.read(navIndexProvider.notifier).state = 2;
      }),
      _Item(Icons.grid_view_rounded, 'الفئات', HomeTheme.sage, () {
        ref.read(navIndexProvider.notifier).state = 1;
      }),
      _Item(Icons.storefront_outlined, 'براندات', HomeTheme.inkSoft, () {
        context.push('/brands');
      }),
      _Item(Icons.qr_code_scanner_rounded, 'مسح', HomeTheme.inkMuted, () {
        context.push('/scan');
      }),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 8, HomeTheme.paddingH, 4),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            Expanded(
              child: HomeStaggerItem(index: i, child: items[i]),
            ),
          ],
        ],
      ),
    );
  }
}

class _Item extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _Item(this.icon, this.label, this.color, this.onTap);

  @override
  Widget build(BuildContext context) {
    return HomeTapScale(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: HomeTheme.sectionSurface(),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 4),
            Text(
              label,
              style: HomeTheme.circleLabel,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

/// شريط ثقة — سطر واحد هادئ.
class HomeTrustStrip extends StatelessWidget {
  final int? freeShippingThreshold;

  const HomeTrustStrip({super.key, this.freeShippingThreshold});

  @override
  Widget build(BuildContext context) {
    final threshold = freeShippingThreshold;
    final shipping = threshold != null && threshold > 0
        ? 'شحن مجاني +${_format(threshold)}'
        : 'توصيل سريع';

    return Padding(
      padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 2, HomeTheme.paddingH, 8),
      child: Text(
        'أصلي · $shipping · دعم واتساب',
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
