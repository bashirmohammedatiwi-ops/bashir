import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/coupon.dart';
import '../../auth/auth_provider.dart';

class CartCheckoutBar extends ConsumerWidget {
  final int total;
  final int discount;
  final int itemCount;
  final Coupon? coupon;

  const CartCheckoutBar({
    super.key,
    required this.total,
    required this.discount,
    required this.itemCount,
    this.coupon,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return ClipRRect(
      child: Container(
        padding: EdgeInsets.fromLTRB(16, 14, 16, bottom + 12),
        decoration: BoxDecoration(
          color: AppColors.surface.withValues(alpha: 0.96),
          border: const Border(top: BorderSide(color: AppColors.hairline)),
          boxShadow: [
            BoxShadow(
              color: AppColors.ink.withValues(alpha: 0.06),
              blurRadius: 20,
              offset: const Offset(0, -6),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('الإجمالي', style: AppTypography.caption.copyWith(fontSize: 11)),
                    const SizedBox(height: 2),
                    Text(formatPrice(total), style: AppTypography.priceLarge.copyWith(fontSize: 22)),
                    if (discount > 0)
                      Text(
                        'وفّرت ${formatPrice(discount)}',
                        style: const TextStyle(
                          color: AppColors.success,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      )
                    else if (coupon?.freeShipping ?? false)
                      const Text(
                        'شحن مجاني',
                        style: TextStyle(
                          color: AppColors.success,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 5,
                child: SizedBox(
                  height: 52,
                  child: FilledButton(
                    onPressed: () {
                      if (!ref.read(authProvider).isAuthenticated) {
                        context.push('/login');
                        return;
                      }
                      context.push('/checkout');
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('إتمام الشراء', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                        SizedBox(width: 6),
                        Icon(Icons.arrow_back_rounded, size: 18),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
