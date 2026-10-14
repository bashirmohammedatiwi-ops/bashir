import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/ui/ui.dart';
import '../../../data/models/coupon.dart';
import '../../auth/auth_provider.dart';
import '../../worlds/world_theme.dart';
import 'cart_theme.dart';
import 'pill_buttons.dart';

/// شريط الدفع الثابت أسفل السلة: تفصيل مختصر + الإجمالي + زر الإتمام.
class CartCheckoutBar extends ConsumerWidget {
  final int subtotal;
  final int discount;
  final int total;
  final int itemCount;
  final int freeShippingThreshold;
  final bool freeShipping;
  final Coupon? coupon;

  const CartCheckoutBar({
    super.key,
    required this.subtotal,
    required this.discount,
    required this.total,
    required this.itemCount,
    required this.freeShippingThreshold,
    required this.freeShipping,
    this.coupon,
  });

  bool get _qualifiesFreeDelivery => freeShipping || (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final t = context.worldTheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(CartTheme.radiusXl)),
        border: Border(top: BorderSide(color: t.accentSoft)),
        boxShadow: CartTheme.dockShadow(context),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 14, CartTheme.hPad, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _Row(label: s.subtotalItems(itemCount), value: formatPrice(subtotal)),
              if (discount > 0) ...[
                const SizedBox(height: 4),
                _Row(label: s.couponDiscount, value: '- ${formatPrice(discount)}', valueColor: AppColors.success),
              ],
              const SizedBox(height: 4),
              _Row(
                label: s.shipping,
                value: _qualifiesFreeDelivery ? s.freeDelivery : s.shippingByDeliveryArea,
                valueColor: _qualifiesFreeDelivery ? AppColors.success : null,
                muted: !_qualifiesFreeDelivery,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1, thickness: 1, color: t.divider),
              ),
              Row(
                children: [
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 140),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(s.totalLabel, style: AppText.caption.copyWith(color: t.inkMuted)),
                        const SizedBox(height: 2),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: AlignmentDirectional.centerStart,
                          child: AnimatedSwitcher(
                            duration: const Duration(milliseconds: 200),
                            child: Text(
                              formatPrice(total),
                              key: ValueKey(total),
                              style: AppText.title1.copyWith(color: t.ink),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: PrimaryPillButton(
                      label: s.checkoutBtn,
                      trailingIcon: Icons.arrow_forward_rounded,
                      strongHaptic: true,
                      onTap: () {
                        if (!ref.read(authProvider).isAuthenticated) {
                          context.push('/login');
                          return;
                        }
                        context.push('/checkout');
                      },
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool muted;

  const _Row({required this.label, required this.value, this.valueColor, this.muted = false});

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppText.caption.copyWith(color: t.inkSoft),
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.end,
            style: AppText.caption.copyWith(
              fontWeight: muted ? FontWeight.w500 : FontWeight.w700,
              color: valueColor ?? (muted ? t.inkMuted : t.ink),
            ),
          ),
        ),
      ],
    );
  }
}
