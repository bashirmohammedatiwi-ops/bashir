import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';

/// عنوان قسم بسيط — بدون زخرفة ثقيلة.
class HomeSimpleSectionHeader extends StatelessWidget {
  const HomeSimpleSectionHeader({
    super.key,
    required this.title,
    this.onSeeAll,
  });

  final String title;
  final VoidCallback? onSeeAll;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSizes.xl,
        AppSizes.md,
        AppSizes.xl,
        AppSizes.sm,
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: AppTextStyles.title(size: 16).copyWith(
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(
                'عرض الكل',
                style: AppTextStyles.caption(
                  color: AppColors.primary,
                  size: 12,
                ).copyWith(fontWeight: FontWeight.w600),
              ),
            ),
        ],
      ),
    );
  }
}
