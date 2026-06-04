import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_sizes.dart';
import '../../../data/models/category_model.dart';
import '../../categories/utils/category_visuals.dart';
import '../../categories/widgets/category_browse_card.dart';

/// شريط فئات أفقي ببطاقات بيضاء (نفس أسلوب صفحة التصفّح).
class HomeCategoryStrip extends StatelessWidget {
  const HomeCategoryStrip({required this.categories, super.key});

  final List<CategoryModel> categories;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    final visible = categories.take(8).toList();

    return SizedBox(
      height: 118,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: AppSizes.xl),
        itemCount: visible.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final cat = visible[index];
          final visual = CategoryVisuals.resolve(
            CategoryVisualInput(name: cat.name, index: index),
          );
          return SizedBox(
            width: 132,
            child: CategoryBrowseCard(
              title: cat.name,
              visual: visual,
              imageUrl: cat.icon,
              onTap: () => context.push(
                '/products?categoryId=${cat.id}&title=${Uri.encodeComponent(cat.name)}',
              ),
            ),
          );
        },
      ),
    );
  }
}
