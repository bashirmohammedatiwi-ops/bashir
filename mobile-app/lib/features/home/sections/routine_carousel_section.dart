import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../../worlds/world_theme.dart';
import '../home_link.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class RoutineCarouselSection extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    if (section.packages.isEmpty) return const SizedBox.shrink();

    final s = ref.s;
    final cardH = cardSizeSpec(section.cardSize).height.clamp(160, 200).toDouble();

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      showTitle: nested ? false : null,
      actionLabel: !nested && section.showViewAll ? s.viewAll : null,
      onAction: !nested && section.showViewAll
          ? () => openViewAllLink(
                context,
                query: section.viewAllQuery,
                fallbackQuery: 'isPromo=1&title=${Uri.encodeComponent(s.skinRoutineTitle)}',
              )
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
            return RepaintBoundary(
              child: GestureDetector(
                onTap: () => openPackageLink(context, p),
                child: _RoutineCard(
                  package: p,
                  width: Responsive.scaledCarouselWidth(
                    context,
                    cardSizeSpec(section.cardSize).width.toDouble(),
                  ),
                ),
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
    final t = context.worldTheme;
    final hasDiscount = package.originalPrice != null && package.originalPrice! > package.price;
    return Container(
      width: width,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: t.hairline.withValues(alpha: 0.8)),
        color: t.surface,
        boxShadow: [
          BoxShadow(
            color: t.accent.withValues(alpha: 0.06),
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
                ? ProductCoverImage(
                    url: package.coverUrl!,
                    width: width,
                    fit: BoxFit.contain,
                  )
                : ColoredBox(
                    color: t.accentLight,
                    child: Icon(Icons.spa_outlined, color: t.accent, size: 40),
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
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: t.ink),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      formatPrice(package.price),
                      style: TextStyle(
                        fontWeight: FontWeight.w900,
                        color: t.accent,
                        fontSize: 13,
                      ),
                    ),
                    if (hasDiscount) ...[
                      const SizedBox(width: 6),
                      Text(
                        formatPrice(package.originalPrice!),
                        style: TextStyle(
                          fontSize: 11,
                          color: t.inkSoft.withValues(alpha: 0.7),
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
