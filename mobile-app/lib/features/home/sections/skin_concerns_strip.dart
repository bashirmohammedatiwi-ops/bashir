import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/category.dart';
import '../home_link.dart';
import '../widgets/circle_tile.dart';
import '../widgets/home_surface_card.dart';

/// شريط مشاكل البشرة — chips / circles / cards.
class SkinConcernsStrip extends StatelessWidget {
  final List<Category> concerns;
  final String? title;
  final String? subtitle;
  final String display;
  final bool showTitle;

  const SkinConcernsStrip({
    super.key,
    required this.concerns,
    this.title,
    this.subtitle,
    this.display = 'chips',
    this.showTitle = true,
  });

  @override
  Widget build(BuildContext context) {
    if (concerns.isEmpty) return const SizedBox.shrink();

    return HomeSurfaceCard(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showTitle && title != null && title!.isNotEmpty)
            SectionHeader(
              title: title!,
              style: SectionHeaderStyle.niceOne,
              compact: true,
            ),
          if (subtitle != null && subtitle!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.screenH,
                0,
                AppSpacing.screenH,
                AppSpacing.sm,
              ),
              child: Text(
                subtitle!,
                style: TextStyle(
                  color: AppColors.textSecondary.withValues(alpha: 0.9),
                  fontSize: 13,
                  height: 1.4,
                ),
              ),
            ),
          if (display == 'circles') _CirclesRow(concerns: concerns),
          if (display == 'cards') _CardsList(concerns: concerns),
          if (display != 'circles' && display != 'cards') _ChipsRow(concerns: concerns),
        ],
      ),
    );
  }
}

void _openConcern(BuildContext context, Category concern) {
  openSectionLink(
    context,
    linkType: concern.linkType ?? 'skinConcern',
    linkValue: concern.linkValue ?? concern.slug,
    legacyLink: concern.link ?? '/products?concernSlug=${Uri.encodeComponent(concern.slug)}',
  );
}

class _ChipsRow extends StatelessWidget {
  final List<Category> concerns;
  const _ChipsRow({required this.concerns});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 46,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
        itemCount: concerns.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (_, i) => _ConcernChip(concern: concerns[i]),
      ),
    );
  }
}

class _CirclesRow extends StatelessWidget {
  final List<Category> concerns;
  const _CirclesRow({required this.concerns});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
        itemCount: concerns.length,
        separatorBuilder: (_, __) => const SizedBox(width: 4),
        itemBuilder: (_, i) {
          final c = concerns[i];
          return CircleTile(
            title: c.name,
            imageUrl: c.imageUrl,
            icon: c.icon,
            onTap: () => _openConcern(context, c),
          );
        },
      ),
    );
  }
}

class _CardsList extends StatelessWidget {
  final List<Category> concerns;
  const _CardsList({required this.concerns});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 120,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.screenH),
        itemCount: concerns.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (_, i) {
          final c = concerns[i];
          return Material(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () => _openConcern(context, c),
              child: SizedBox(
                width: 200,
                child: Row(
                  children: [
                    SizedBox(
                      width: 72,
                      height: double.infinity,
                      child: c.imageUrl.isNotEmpty
                          ? AppNetworkImage(url: c.imageUrl, fit: BoxFit.cover)
                          : ColoredBox(
                              color: AppColors.primaryLight,
                              child: Center(
                                child: Text(c.icon ?? '✨', style: const TextStyle(fontSize: 28)),
                              ),
                            ),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              c.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                            ),
                            if (c.description != null && c.description!.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                c.description!,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary.withValues(alpha: 0.9),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
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
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(AppRadius.pill),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.pill),
        onTap: () => _openConcern(context, concern),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.pill),
            gradient: LinearGradient(
              colors: [
                AppColors.primaryLight.withValues(alpha: 0.65),
                AppColors.surface,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
          ),
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
