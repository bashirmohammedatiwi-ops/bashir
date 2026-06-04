import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../../core/widgets/category_icon.dart';
import '../../../core/widgets/luxe.dart';
import '../utils/category_visuals.dart';

/// بطاقة فئة أفقية: عنوان أعلى + أيقونة خطية أسفل — خلفية بيضاء مسطحة.
class CategoryBrowseCard extends StatelessWidget {
  const CategoryBrowseCard({
    super.key,
    required this.title,
    required this.visual,
    this.imageUrl,
    this.subtitle,
    required this.onTap,
  });

  final String title;
  final CategoryVisual visual;
  final String? imageUrl;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasNetworkImage =
        imageUrl != null && CategoryIcon.isNetworkUrl(imageUrl!);

    return PressedScale(
      onTap: onTap,
      scale: 0.98,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSizes.cardRadius),
          border: Border.all(color: AppColors.dividerLight),
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSizes.md,
                AppSizes.md,
                AppSizes.md,
                AppSizes.md,
              ),
              child: Align(
                alignment: AlignmentDirectional.topStart,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.title(size: 15).copyWith(
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty) ...[
                      const SizedBox(height: AppSizes.xs),
                      Text(
                        subtitle!,
                        style: AppTextStyles.caption(
                          color: AppColors.textMuted,
                          size: 11,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            PositionedDirectional(
              end: AppSizes.sm,
              bottom: AppSizes.sm,
              child: hasNetworkImage
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(AppSizes.chipRadius),
                      child: CachedImageWidget(
                        imageUrl: imageUrl!,
                        width: 52,
                        height: 52,
                        fit: BoxFit.cover,
                      ),
                    )
                  : Icon(
                      visual.icon,
                      size: 48,
                      color: visual.color.withValues(alpha: 0.88),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
