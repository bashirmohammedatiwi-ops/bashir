import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import 'cart_theme.dart';

class CartShippingBanner extends StatelessWidget {
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
  Widget build(BuildContext context) {
    if (threshold <= 0 && !freeShippingCoupon) return const SizedBox.shrink();

    final achieved = freeShippingCoupon || (threshold > 0 && subtotal >= threshold);
    final remaining = threshold > 0 ? (threshold - subtotal).clamp(0, threshold) : 0;
    final progress = threshold > 0 ? (subtotal / threshold).clamp(0.0, 1.0) : 1.0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 0, CartTheme.hPad, 4),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: achieved ? null : onBrowse,
          borderRadius: BorderRadius.circular(CartTheme.radiusLg),
          child: Ink(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(CartTheme.radiusLg),
              gradient: LinearGradient(
                colors: achieved
                    ? [const Color(0xFFEEF9F2), const Color(0xFFF7FCF9)]
                    : [AppColors.accentSoft.withValues(alpha: 0.5), AppColors.blush],
              ),
              border: Border.all(
                color: achieved
                    ? AppColors.success.withValues(alpha: 0.2)
                    : AppColors.accent.withValues(alpha: 0.25),
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(
                      achieved ? Icons.check_circle_rounded : Icons.local_shipping_outlined,
                      color: achieved ? AppColors.success : AppColors.accent,
                      size: 22,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        achieved
                            ? (freeShippingCoupon ? 'شحن مجاني مع الكوبون ✓' : 'مبروك! توصيل مجاني')
                            : 'باقي ${formatPrice(remaining)} للتوصيل المجاني',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: achieved ? AppColors.success : AppColors.textPrimary,
                        ),
                      ),
                    ),
                    if (!achieved)
                      Icon(Icons.chevron_left_rounded, color: AppColors.textMuted.withValues(alpha: 0.8)),
                  ],
                ),
                if (!achieved && threshold > 0) ...[
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 5,
                      backgroundColor: AppColors.surface.withValues(alpha: 0.7),
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
