import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../core/theme/text_styles.dart';
import '../../../core/widgets/cached_image_widget.dart';
import '../../../core/widgets/category_icon.dart';
import '../../../core/widgets/luxe.dart';
import '../../../data/models/category_model.dart';
import '../../categories/utils/category_visuals.dart';

/// فئات الرئيسية — شبكة بطاقات بيضاء مدمجة.
class HomeCategoriesGrid extends StatelessWidget {
  const HomeCategoriesGrid({required this.categories, super.key});

  final List<CategoryModel> categories;

  static const _maxItems = 6;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    final visible = categories.take(_maxItems).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSizes.xl),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.55,
        ),
        itemCount: visible.length,
        itemBuilder: (context, index) {
          final cat = visible[index];
          final visual = CategoryVisuals.resolve(
            CategoryVisualInput(name: cat.name, index: index),
          );
          return _HomeCategoryTile(
            name: cat.name,
            icon: cat.icon,
            visual: visual,
            onTap: () => context.push(
              '/products?categoryId=${cat.id}&title=${Uri.encodeComponent(cat.name)}',
            ),
          );
        },
      ),
    );
  }
}

class _HomeCategoryTile extends StatelessWidget {
  const _HomeCategoryTile({
    required this.name,
    required this.icon,
    required this.visual,
    required this.onTap,
  });

  final String name;
  final String icon;
  final CategoryVisual visual;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasImage = CategoryIcon.isNetworkUrl(icon);

    return PressedScale(
      onTap: onTap,
      scale: 0.97,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.dividerLight),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              PositionedDirectional(
                top: 0,
                start: 0,
                end: 0,
                child: Container(
                  height: 3,
                  color: visual.color.withValues(alpha: 0.55),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 14, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.title(size: 13.5).copyWith(
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                    ),
                    const Spacer(),
                    Align(
                      alignment: AlignmentDirectional.centerEnd,
                      child: hasImage
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: CachedImageWidget(
                                imageUrl: icon,
                                width: 44,
                                height: 44,
                                fit: BoxFit.cover,
                              ),
                            )
                          : Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: visual.color.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                visual.icon,
                                size: 24,
                                color: visual.color,
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
