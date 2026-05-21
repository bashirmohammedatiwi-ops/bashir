import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/luxe.dart';
import '../../../data/models/category_model.dart';
import '../providers/home_provider.dart';

/// شريط فئات أنيق بدوائر تونّت دافئة + lottie-like ripple.
class CategoryCircles extends ConsumerWidget {
  const CategoryCircles({super.key, this.categories});

  final List<CategoryModel>? categories;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cats = categories ??
        ref.watch(categoriesProvider).valueOrNull ??
        const <CategoryModel>[];

    if (cats.isEmpty) {
      return const SizedBox(height: 102);
    }

    return SizedBox(
      height: 102,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
        itemCount: cats.length,
        itemBuilder: (context, index) {
          final cat = cats[index];
          final tint =
              AppColors.productTints[index % AppColors.productTints.length];
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
                          border: Border.all(
                            color: AppColors.divider,
                            width: 1,
                          ),
                        ),
                      ),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              tint,
                              Color.lerp(tint, Colors.white, 0.5)!,
                            ],
                          ),
                        ),
                        child: Center(
                          child: Text(
                            cat.icon,
                            style: const TextStyle(fontSize: 24),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 6,
                        right: 6,
                        child: Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            color: AppColors.gold,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    cat.name,
                    style: AppTextStyles.caption(
                      color: AppColors.textPrimary,
                      size: 10.5,
                    ).copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.1,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
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
