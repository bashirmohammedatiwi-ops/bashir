import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/category_icon.dart';
import '../../../core/widgets/luxe.dart';
import '../../../data/models/category_model.dart';

class CategoryCircles extends ConsumerWidget {
  const CategoryCircles({required this.categories, super.key});

  final List<CategoryModel> categories;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cats = categories;
    if (cats.isEmpty) return const SizedBox.shrink();
    return SizedBox(
      height: 102,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
        itemCount: cats.length,
        itemBuilder: (context, index) {
          final cat = cats[index];
          final tint = AppColors.productTints[index % AppColors.productTints.length];
          return PressedScale(
            onTap: () => context.push(
              '/products?categoryId=${cat.id}&title=${Uri.encodeComponent(cat.name)}',
            ),
            scale: 0.92,
            child: Container(
              width: 76,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.divider),
                        ),
                      ),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: tint.withValues(alpha: 0.35),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: CategoryIcon(
                          icon: cat.icon,
                          size: 56,
                          fallbackStyle: const TextStyle(fontSize: 26),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    cat.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
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
