import 'package:flutter/material.dart';

import '../../../features/worlds/world_theme.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_text.dart';
import '../../utils/formatters.dart';

/// شارة الخصم الموحّدة "-25%".
class DiscountBadge extends StatelessWidget {
  final num percent;
  final bool large;

  const DiscountBadge({super.key, required this.percent, this.large = false});

  @override
  Widget build(BuildContext context) {
    if (percent <= 0) return const SizedBox.shrink();
    return Container(
      padding: EdgeInsets.symmetric(horizontal: large ? 10 : 7, vertical: large ? 4 : 3),
      decoration: BoxDecoration(
        color: AppColors.sale,
        borderRadius: BorderRadius.circular(AppCorners.pill),
        boxShadow: [
          BoxShadow(
            color: AppColors.sale.withValues(alpha: 0.25),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        formatDiscount(percent),
        style: AppText.micro.copyWith(color: Colors.white, fontSize: large ? 12.5 : 11),
      ),
    );
  }
}

/// السعر الحالي + السعر قبل الخصم — نفس الترتيب والألوان في كل البطاقات.
class PriceView extends StatelessWidget {
  final num price;
  final num? oldPrice;
  final bool large;
  final bool stacked;

  const PriceView({
    super.key,
    required this.price,
    this.oldPrice,
    this.large = false,
    this.stacked = false,
  });

  bool get _onSale => oldPrice != null && oldPrice! > price;

  @override
  Widget build(BuildContext context) {
    final t = context.worldTheme;
    final current = Text(
      formatPrice(price),
      maxLines: 1,
      style: (large ? AppText.priceLarge : AppText.price).copyWith(
        color: _onSale ? AppColors.sale : t.ink,
      ),
    );
    if (!_onSale) return current;

    final old = Text(
      formatPrice(oldPrice),
      maxLines: 1,
      style: AppText.caption.copyWith(
        fontSize: large ? 14 : 11.5,
        color: t.inkMuted,
        decoration: TextDecoration.lineThrough,
        decorationColor: t.inkMuted,
      ),
    );
    if (stacked) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [current, const SizedBox(height: 1), old],
      );
    }
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      children: [current, old],
    );
  }
}
