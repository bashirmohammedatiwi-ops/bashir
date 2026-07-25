import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import 'cart_theme.dart';

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
    if (threshold <= 0 && !freeShippingCoupon) return const SizedBox.shrink();

    final achieved = freeShippingCoupon || (threshold > 0 && subtotal >= threshold);
    final remaining = threshold > 0 ? (threshold - subtotal).clamp(0, threshold) : 0;
    final progress = threshold > 0 ? (subtotal / threshold).clamp(0.0, 1.0) : 1.0;

    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 8, CartTheme.hPad, 0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: achieved ? null : onBrowse,
          borderRadius: BorderRadius.circular(CartTheme.radiusMd),
          child: Ink(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: achieved ? const Color(0xFFEEF9F4) : CartTheme.brandWash,
              borderRadius: BorderRadius.circular(CartTheme.radiusMd),
              border: Border.all(
                color: achieved
                    ? AppColors.success.withValues(alpha: 0.2)
                    : CartTheme.brandSoft,
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: achieved
                            ? AppColors.success.withValues(alpha: 0.12)
                            : CartTheme.brandSoft,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        achieved ? Icons.check_rounded : Icons.local_shipping_outlined,
                        color: achieved ? AppColors.success : CartTheme.brand,
                        size: 18,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        achieved
                            ? (freeShippingCoupon ? s.freeShippingWithCoupon : s.freeShippingCongrats)
                            : s.remainingForFreeShipping(formatPrice(remaining)),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: achieved ? AppColors.success : CartTheme.charcoal,
                        ),
                      ),
                    ),
                  ],
                ),
                if (!achieved && threshold > 0) ...[
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 4,
                      backgroundColor: Colors.white,
                      color: CartTheme.brand,
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
