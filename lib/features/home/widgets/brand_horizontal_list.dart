import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';
import '../../../data/mock/mock_brands.dart';

class BrandHorizontalList extends StatelessWidget {
  const BrandHorizontalList({super.key});

  @override
  Widget build(BuildContext context) {
    final brands = MockBrands.all.where((b) => b.isFeatured).toList();

    return SizedBox(
      height: 112,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
        itemCount: brands.length,
        itemBuilder: (context, index) {
          final brand = brands[index];
          return PressedScale(
            onTap: () => context.push(
              '/products?brandId=${brand.id}&title=${Uri.encodeComponent(brand.name)}',
            ),
            child: Container(
              width: 100,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppSizes.cardRadius),
                border: Border.all(color: AppColors.divider),
                boxShadow: const [AppColors.softShadow],
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Initial badge with shimmer
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.canvas,
                          AppColors.goldSoft.withValues(alpha: 0.6),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.35),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        brand.initial,
                        style: AppTextStyles.serif(
                          color: AppColors.primaryDark,
                          size: 22,
                          weight: FontWeight.w500,
                          style: FontStyle.italic,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      brand.name,
                      style: AppTextStyles.caption(
                        color: AppColors.textPrimary,
                        size: 10.5,
                      ).copyWith(fontWeight: FontWeight.w800, letterSpacing: 0.2),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Luxe.goldenRule(width: 22),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
