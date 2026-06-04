import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../../core/widgets/luxe.dart';
import '../../../data/models/brand_model.dart';

class BrandHorizontalList extends StatelessWidget {
  const BrandHorizontalList({required this.brands, super.key});

  final List<BrandModel> brands;

  @override
  Widget build(BuildContext context) {
    final list = brands;
    if (list.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 112,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
        itemCount: list.length,
        itemBuilder: (context, index) {
          final brand = list[index];
          return PressedScale(
            onTap: () => context.push(
              '/products?brandId=${brand.id}&title=${Uri.encodeComponent(brand.name)}',
            ),
            child: Container(
              width: 100,
              margin: const EdgeInsets.only(left: 10),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.divider),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (brand.logoUrl != null && brand.logoUrl!.startsWith('http'))
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedImageWidget(
                        imageUrl: brand.logoUrl!,
                        width: 48,
                        height: 48,
                        fit: BoxFit.contain,
                      ),
                    )
                  else
                    CircleAvatar(
                      backgroundColor: brand.bgColor ?? AppColors.primarySoft,
                      child: Text(
                        brand.initial,
                        style: AppTextStyles.title(color: AppColors.primary),
                      ),
                    ),
                  const SizedBox(height: 6),
                  Text(
                    brand.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.caption(size: 10),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
