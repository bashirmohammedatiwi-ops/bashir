import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../worlds/world_theme.dart';
import '../cart_strings.dart';
import 'cart_theme.dart';

/// شريط التقدّم نحو التوصيل المجاني — يتحوّل لبطاقة احتفال عند الوصول.
class CartShippingBanner extends ConsumerWidget {
  final int subtotal;
  final int threshold;
  final bool freeShippingCoupon;
  final VoidCallback? onBrowse;

  const CartShippingBanner({
    super.key,
    required this.subtotal,
    required this.threshold,
    required this.freeShippingCoupon,
    this.onBrowse,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    if (threshold <= 0 && !freeShippingCoupon) return const SizedBox.shrink();

    final achieved = freeShippingCoupon || (threshold > 0 && subtotal >= threshold);
    final remaining = threshold > 0 ? (threshold - subtotal).clamp(0, threshold) : 0;
    final progress = threshold > 0 ? (subtotal / threshold).clamp(0.0, 1.0) : 1.0;
    final almost = !achieved && progress >= 0.75;
    final fg = achieved ? AppColors.success : t.ink;

    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 14, CartTheme.hPad, 0),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          color: achieved ? Color.alphaBlend(AppColors.success.withValues(alpha: 0.08), t.surface) : t.surface,
          borderRadius: BorderRadius.circular(CartTheme.radiusLg),
          border: Border.all(color: achieved ? AppColors.success.withValues(alpha: 0.25) : t.accentSoft),
          boxShadow: CartTheme.softShadow(context),
        ),
        padding: const EdgeInsetsDirectional.fromSTEB(14, 14, 10, 14),
        child: Column(
          children: [
            Row(
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (c, a) => ScaleTransition(scale: a, child: c),
                  child: KeyedSubtree(
                    key: ValueKey(achieved),
                    child: CartTheme.iconBadge(
                      context,
                      achieved ? Icons.celebration_outlined : Icons.local_shipping_outlined,
                      color: achieved ? AppColors.success : null,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (almost)
                        Text(
                          s.almostFreeShipping,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppText.micro.copyWith(color: t.accent),
                        ),
                      Text(
                        achieved
                            ? (freeShippingCoupon ? s.freeShippingWithCoupon : s.freeShippingCongrats)
                            : s.remainingForFreeShipping(formatPrice(remaining)),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: AppText.label.copyWith(color: fg),
                      ),
                    ],
                  ),
                ),
                if (!achieved && onBrowse != null) ...[
                  const SizedBox(width: 6),
                  ViewAllButton(label: s.addMoreItems, onTap: onBrowse!),
                ],
              ],
            ),
            if (!achieved && threshold > 0) ...[
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 4),
                child: _ProgressTrack(value: progress),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ProgressTrack extends StatelessWidget {
  final double value;
  const _ProgressTrack({required this.value});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return TweenAnimationBuilder<double>(
      tween: Tween(end: value),
      duration: const Duration(milliseconds: 650),
      curve: Curves.easeOutCubic,
      builder: (context, v, _) => Container(
        height: 6,
        decoration: BoxDecoration(color: t.accentSoft, borderRadius: BorderRadius.circular(AppCorners.pill)),
        alignment: AlignmentDirectional.centerStart,
        child: FractionallySizedBox(
          widthFactor: v.clamp(0.04, 1.0),
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: t.signatureGradient,
              borderRadius: BorderRadius.circular(AppCorners.pill),
            ),
            child: const SizedBox.expand(),
          ),
        ),
      ),
    );
  }
}
