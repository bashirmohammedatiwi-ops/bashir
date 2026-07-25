import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/formatters.dart';
import 'cart_theme.dart';

class CartSummaryCard extends StatelessWidget {
  final int subtotal;
  final int discount;
  final bool freeShipping;
  final int itemCount;
  final int total;

  const CartSummaryCard({
    super.key,
    required this.subtotal,
    required this.discount,
    required this.freeShipping,
    required this.itemCount,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(CartTheme.hPad, 18, CartTheme.hPad, 0),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: CartTheme.cardDecoration(),
        child: Column(
          children: [
            _Row(label: 'المجموع ($itemCount)', value: formatPrice(subtotal)),
            if (discount > 0) ...[
              const SizedBox(height: 10),
              _Row(
                label: 'خصم الكوبون',
                value: '- ${formatPrice(discount)}',
                valueColor: AppColors.success,
              ),
            ],
            const SizedBox(height: 10),
            _Row(
              label: 'الشحن',
              value: freeShipping ? 'مجاني' : 'يُحسب عند الدفع',
              valueColor: freeShipping ? AppColors.success : null,
              muted: !freeShipping,
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Divider(height: 1, color: AppColors.divider),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('الإجمالي', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                Text(formatPrice(total), style: AppTypography.priceLarge.copyWith(fontSize: 20)),
              ],
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
  final bool muted;

  const _Row({
    required this.label,
    required this.value,
    this.valueColor,
    this.muted = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: muted ? AppColors.textMuted : AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}
