import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class RoutineCarouselSection extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  final bool nested;

  const RoutineCarouselSection({
    super.key,
    required this.section,
    this.compactTop = false,
    this.nested = false,
  });

  @override
  Widget build(BuildContext context) {
    if (section.packages.isEmpty) return const SizedBox.shrink();

    final cardH = cardSizeSpec(section.cardSize).height.clamp(160, 200).toDouble();

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      showTitle: nested ? false : null,
      actionLabel: !nested && section.showViewAll ? 'عرض الكل' : null,
      onAction: !nested && section.viewAllQuery != null
          ? () => context.push('/products?${section.viewAllQuery}')
          : null,
      child: SizedBox(
        height: cardH,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 0, HomeTheme.paddingH, 4),
          itemCount: section.packages.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) {
            final p = section.packages[i];
            final link = p.link;
            return RepaintBoundary(
              child: GestureDetector(
                onTap: () {
                  if (link != null && link.isNotEmpty) {
                    context.push(link);
                  } else {
                    context.push('/package/${p.slug.isNotEmpty ? p.slug : p.id}');
                  }
                },
                child: _RoutineCard(package: p, width: cardSizeSpec(section.cardSize).width.clamp(180, 230).toDouble()),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _RoutineCard extends StatelessWidget {
  final HomePackage package;
  final double width;
  const _RoutineCard({required this.package, required this.width});

  @override
  Widget build(BuildContext context) {
    final hasDiscount = package.originalPrice != null && package.originalPrice! > package.price;
    return Container(
      width: width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.8)),
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.06),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: package.coverUrl != null && package.coverUrl!.isNotEmpty
                ? AppNetworkImage(url: package.coverUrl!, width: width, fit: BoxFit.cover)
                : Container(
                    color: AppColors.primaryLight,
                    alignment: Alignment.center,
                    child: const Icon(Icons.spa_outlined, color: AppColors.primary, size: 40),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  package.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      formatPrice(package.price),
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                        fontSize: 13,
                      ),
                    ),
                    if (hasDiscount) ...[
                      const SizedBox(width: 6),
                      Text(
                        formatPrice(package.originalPrice!),
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary.withValues(alpha: 0.7),
                          decoration: TextDecoration.lineThrough,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
