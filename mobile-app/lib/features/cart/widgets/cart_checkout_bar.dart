import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/coupon.dart';
import '../../auth/auth_provider.dart';
import 'cart_theme.dart';

class CartCheckoutBar extends ConsumerWidget {
  final int subtotal;
  final int discount;
  final int total;
  final int itemCount;
  final bool freeShipping;
  final Coupon? coupon;

  const CartCheckoutBar({
    super.key,
    required this.subtotal,
    required this.discount,
    required this.total,
    required this.itemCount,
    required this.freeShipping,
    this.coupon,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: CartTheme.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(CartTheme.radiusXl)),
        border: Border(top: BorderSide(color: CartTheme.brandSoft)),
        boxShadow: CartTheme.dockShadow,
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 12, CartTheme.hPad, 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _Row(label: s.subtotalItems(itemCount), value: formatPrice(subtotal)),
            if (discount > 0) ...[
              const SizedBox(height: 5),
              _Row(
                label: s.couponDiscount,
                value: '- ${formatPrice(discount)}',
                valueColor: AppColors.success,
              ),
            ],
            const SizedBox(height: 5),
            _Row(
              label: s.shipping,
              value: freeShipping ? s.free : s.shippingAtCheckout,
              valueColor: freeShipping ? AppColors.success : null,
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 52,
              width: double.infinity,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: CartTheme.brandGradient,
                  borderRadius: BorderRadius.circular(999),
                  boxShadow: [
                    BoxShadow(
                      color: CartTheme.brand.withValues(alpha: 0.3),
                      blurRadius: 14,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      if (!ref.read(authProvider).isAuthenticated) {
                        context.push('/login');
                        return;
                      }
                      context.push('/checkout');
                    },
                    borderRadius: BorderRadius.circular(999),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          s.checkoutBtn,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.22),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            formatPrice(total),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 18),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _Row({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.caption.copyWith(fontSize: 12)),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 12,
            color: valueColor ?? CartTheme.charcoal,
          ),
        ),
      ],
    );
  }
}
