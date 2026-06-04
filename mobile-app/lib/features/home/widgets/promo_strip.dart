import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';

/// شريط ترويجي خفيف.
class PromoStrip extends StatelessWidget {
  const PromoStrip({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.xl),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.primaryMist,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.dividerLight),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.local_shipping_outlined,
              color: AppColors.primary,
              size: 22,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'شحن مجاني',
                    style: AppTextStyles.title(size: 13).copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'للطلبات فوق ٥٠ ألف د.ع',
                    style: AppTextStyles.caption(
                      color: AppColors.textSecondary,
                      size: 11,
                    ),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: () => context.push('/loyalty'),
              child: const Text('النقاط'),
            ),
          ],
        ),
      ),
    );
  }
}

