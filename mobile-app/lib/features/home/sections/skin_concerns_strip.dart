import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../data/models/category.dart';

/// شريط مشاكل البشرة — بدون عنوان (Nice One).
class SkinConcernsStrip extends StatelessWidget {
  final List<Category> concerns;
  final String? title;
  final String? subtitle;

  const SkinConcernsStrip({
    super.key,
    required this.concerns,
    this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    if (concerns.isEmpty) return const SizedBox.shrink();

    return ColoredBox(
      color: AppColors.surface,
      child: SizedBox(
        height: 44,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
          itemCount: concerns.length,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
          itemBuilder: (_, i) => _ConcernChip(concern: concerns[i]),
        ),
      ),
    );
  }
}

class _ConcernChip extends StatelessWidget {
  final Category concern;

  const _ConcernChip({required this.concern});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.primaryLight.withValues(alpha: 0.65),
      borderRadius: BorderRadius.circular(AppRadius.pill),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.pill),
        onTap: () => context.push(
          '/products?concernSlug=${concern.slug}&title=${Uri.encodeComponent(concern.name)}',
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (concern.icon != null && concern.icon!.isNotEmpty) ...[
                Text(concern.icon!, style: const TextStyle(fontSize: 14)),
                const SizedBox(width: 6),
              ],
              Text(
                concern.name,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
