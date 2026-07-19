import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/category.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';
import '../widgets/home_section_shell.dart';

class CategoryTilesSection extends StatelessWidget {
  final HomeSection section;
  const CategoryTilesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.categories.isEmpty) return const SizedBox.shrink();

    final maxH = section.categories
        .map((c) => _specFor(c, section).height)
        .fold(142.0, (a, b) => a > b ? a : b);

    return HomeSectionShell(
      section: section,
      actionLabel: 'الكل',
      onAction: () => context.push('/categories'),
      child: SizedBox(
        height: maxH + 26,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 0, AppSpacing.screenH, AppSpacing.md),
          itemCount: section.categories.length,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
          itemBuilder: (_, i) {
            final cat = section.categories[i];
            final spec = _specFor(cat, section, i);
            return Align(
              alignment: Alignment.bottomCenter,
              child: _CategoryTile(
                category: cat,
                width: spec.width,
                height: spec.height,
              ),
            );
          },
        ),
      ),
    );
  }

  CardSizeSpec _specFor(Category cat, HomeSection section, [int index = 0]) =>
      resolveItemCardSize(
        cardSize: cat.cardSize,
        sectionLayout: section.sectionLayout,
        index: index,
        defaultSize: section.cardSize,
      );
}

class MakeupCategoriesSection extends StatelessWidget {
  final HomeSection section;
  const MakeupCategoriesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.categories.isEmpty) return const SizedBox.shrink();
    final accent = parseHexColor(section.backgroundColor) ?? AppColors.primaryLight;

    final maxH = section.categories
        .map((c) => resolveItemCardSize(
              cardSize: c.cardSize,
              sectionLayout: section.sectionLayout,
              defaultSize: section.cardSize ?? 'md',
            ).height)
        .fold(152.0, (a, b) => a > b ? a : b);

    return HomeSectionShell(
      section: section,
      child: SizedBox(
        height: maxH + 24,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 0, AppSpacing.screenH, AppSpacing.md),
          itemCount: section.categories.length,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
          itemBuilder: (_, i) {
            final cat = section.categories[i];
            final spec = resolveItemCardSize(
              cardSize: cat.cardSize,
              sectionLayout: section.sectionLayout,
              index: i,
              defaultSize: section.cardSize,
            );
            return Align(
              alignment: Alignment.bottomCenter,
              child: _MakeupCard(
                category: cat,
                accent: accent,
                width: spec.width,
                height: spec.height,
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  final Category category;
  final double width;
  final double height;

  const _CategoryTile({
    required this.category,
    required this.width,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(
        '/products?categoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
      ),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.1),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (category.imageUrl.isNotEmpty)
                AppNetworkImage(url: category.imageUrl, fit: BoxFit.cover)
              else
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFFFCE4EC), Color(0xFFE8F4FC)],
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    category.icon ?? category.name.characters.first,
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withValues(alpha: 0.02),
                      Colors.black.withValues(alpha: 0.55),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(10),
                child: Align(
                  alignment: Alignment.bottomRight,
                  child: Text(
                    category.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                      height: 1.2,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MakeupCard extends StatelessWidget {
  final Category category;
  final Color accent;
  final double width;
  final double height;

  const _MakeupCard({
    required this.category,
    required this.accent,
    required this.width,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push(
        '/products?categoryId=${category.id}&title=${Uri.encodeComponent(category.name)}',
      ),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.textPrimary.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                color: accent,
                child: category.imageUrl.isNotEmpty
                    ? AppNetworkImage(url: category.imageUrl, fit: BoxFit.contain)
                    : const Icon(Icons.brush_outlined, color: AppColors.primary, size: 36),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
              child: Text(
                category.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
