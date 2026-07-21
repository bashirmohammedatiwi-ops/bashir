import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../shell/main_shell.dart';
import 'home_animations.dart';
import 'home_theme.dart';

/// اختصارات سريعة — أيقونات دائرية ناعمة.
class HomeQuickDock extends ConsumerWidget {
  const HomeQuickDock({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = [
      _Item(Icons.local_offer_outlined, 'العروض', HomeTheme.roseWash, AppColors.primary, () {
        ref.read(navIndexProvider.notifier).state = 2;
      }),
      _Item(Icons.grid_view_rounded, 'الفئات', HomeTheme.sageLight, HomeTheme.sage, () {
        ref.read(navIndexProvider.notifier).state = 1;
      }),
      _Item(Icons.storefront_outlined, 'براندات', HomeTheme.sand, HomeTheme.inkSoft, () {
        context.push('/brands');
      }),
      _Item(Icons.qr_code_scanner_rounded, 'مسح', HomeTheme.lavender, HomeTheme.sageDark, () {
        context.push('/scan');
      }),
    ];

    return Padding(
      padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 10, HomeTheme.paddingH, 2),
      child: Row(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0) const SizedBox(width: 6),
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
  final Color bg;
  final Color iconColor;
  final VoidCallback onTap;

  const _Item(this.icon, this.label, this.bg, this.iconColor, this.onTap);

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
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: bg,
              shape: BoxShape.circle,
              border: Border.all(color: HomeTheme.surfaceMuted.withValues(alpha: 0.55)),
              boxShadow: HomeTheme.whisperLift,
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 21, color: iconColor),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            style: HomeTheme.circleLabel,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
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
      padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 6, HomeTheme.paddingH, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _dot(),
          const SizedBox(width: 8),
          Text(
            'أصلي',
            style: HomeTheme.body(size: 11, color: HomeTheme.inkMuted, weight: FontWeight.w600),
          ),
          const SizedBox(width: 8),
          _dot(),
          const SizedBox(width: 8),
          Text(
            shipping,
            style: HomeTheme.body(size: 11, color: HomeTheme.inkMuted, weight: FontWeight.w600),
          ),
          const SizedBox(width: 8),
          _dot(),
          const SizedBox(width: 8),
          Text(
            'دعم واتساب',
            style: HomeTheme.body(size: 11, color: HomeTheme.inkMuted, weight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  static Widget _dot() => Container(
        width: 3,
        height: 3,
        decoration: BoxDecoration(
          color: HomeTheme.sageMid,
          shape: BoxShape.circle,
        ),
      );

  static String _format(int n) {
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}k';
    return '$n';
  }
}
