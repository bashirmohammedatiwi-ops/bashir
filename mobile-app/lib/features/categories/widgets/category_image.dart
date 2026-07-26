import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/category.dart';
import 'categories_theme.dart';

/// صورة القسم مع fallback أنيق.
class CategoryImage extends StatelessWidget {
  final Category category;
  final String lang;
  final double? width;
  final double? height;
  final BoxFit fit;
  final bool containPadding;

  const CategoryImage({
    super.key,
    required this.category,
    required this.lang,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.containPadding = false,
  });

  @override
  Widget build(BuildContext context) {
    if (category.imageUrl.isNotEmpty) {
      final image = AppNetworkImage(
        url: category.imageUrl,
        width: width,
        height: height,
        fit: fit,
        backgroundColor: CategoriesTheme.imageBg,
      );
      if (!containPadding) return image;
      return ColoredBox(
        color: CategoriesTheme.imageBg,
        child: Padding(
          padding: EdgeInsets.all((height ?? width ?? 48) * 0.1),
          child: image,
        ),
      );
    }

    final initial = category.icon?.trim().isNotEmpty == true
        ? category.icon!
        : category.localizedName(lang).characters.first;

    return ColoredBox(
      color: AppColors.primaryLight,
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            fontSize: (height ?? 48) * 0.32,
            fontWeight: FontWeight.w800,
            color: AppColors.primary.withValues(alpha: 0.55),
          ),
        ),
      ),
    );
  }
}
