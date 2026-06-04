import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';

/// سطر ترويجي واحد — بدون صندوق.
class HomePromoLine extends StatelessWidget {
  const HomePromoLine({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSizes.xl,
        vertical: AppSizes.sm,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(width: 24, height: 1, color: AppColors.gold.withValues(alpha: 0.5)),
          const SizedBox(width: 10),
          Text(
            'شحن مجاني للطلبات فوق ٥٠ ألف د.ع',
            style: AppTextStyles.caption(
              color: AppColors.textSecondary,
              size: 11,
            ).copyWith(letterSpacing: 0.2),
          ),
          const SizedBox(width: 10),
          Container(width: 24, height: 1, color: AppColors.gold.withValues(alpha: 0.5)),
        ],
      ),
    );
  }
}
