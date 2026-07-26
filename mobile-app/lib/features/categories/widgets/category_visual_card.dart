import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../data/models/category.dart';
import 'categories_theme.dart';
import 'category_line_art.dart';

/// بطاقة قسم — اسم أعلى ثم صورة في الأسفل (بدون تداخل).
class CategoryVisualCard extends StatelessWidget {
  final Category category;
  final String lang;
  final VoidCallback onTap;

  const CategoryVisualCard({
    super.key,
    required this.category,
    required this.lang,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final name = category.localizedName(lang);

    return AspectRatio(
      aspectRatio: CategoriesTheme.cardAspectRatio,
      child: CategoriesFramedSurface(
        onTap: _tap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                CategoriesTheme.titlePad,
                10,
                CategoriesTheme.titlePad,
                6,
              ),
              child: Text(
                name,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: CategoriesTheme.titleSize,
                  fontWeight: FontWeight.w700,
                  height: 1.2,
                  letterSpacing: -0.15,
                  color: CategoriesTheme.titleColor,
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: ColoredBox(
                    color: CategoriesTheme.imageBg,
                    child: CategoryLineArt(
                      category: category,
                      expand: true,
                      alignCorner: true,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _tap() {
    HapticFeedback.selectionClick();
    onTap();
  }
}

/// شريحة تصفية — خط سفلي عند التحديد.
class CategoryFilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const CategoryFilterChip({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: CategoriesTheme.titleColor,
                ),
              ),
              const SizedBox(height: 6),
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: CategoriesTheme.curve,
                height: 2,
                width: selected ? 28 : 0,
                color: CategoriesTheme.titleColor,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
