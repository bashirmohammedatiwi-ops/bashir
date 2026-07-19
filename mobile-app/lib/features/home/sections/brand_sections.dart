import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../widgets/home_section_shell.dart';

class BrandHomeSection extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  const BrandHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  Widget build(BuildContext context) {
    if (section.brands.isEmpty) return const SizedBox.shrink();
    final isCards = section.layout == 'cards';

    final maxH = section.brands
        .map((b) => resolveItemCardSize(
              cardSize: b.cardSize,
              sectionLayout: section.sectionLayout,
              defaultSize: section.cardSize,
            ).height)
        .fold(96.0, (a, b) => a > b ? a : b);

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: 'الكل',
      onAction: () => context.push('/brands'),
      child: SizedBox(
        height: maxH + (isCards ? 36 : 24),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(AppSpacing.screenH, 0, AppSpacing.screenH, AppSpacing.md),
          itemCount: section.brands.length,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
          itemBuilder: (_, i) {
            final b = section.brands[i];
            final spec = resolveItemCardSize(
              cardSize: b.cardSize,
              sectionLayout: section.sectionLayout,
              index: i,
              defaultSize: section.cardSize,
            );
            return Align(
              alignment: Alignment.bottomCenter,
              child: GestureDetector(
                onTap: () => context.push(
                  '/products?brandId=${b.id}&title=${Uri.encodeComponent(b.name)}',
                ),
                child: Container(
                  width: spec.width,
                  height: spec.height,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: isCards
                        ? const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFFE8F4FC), Color(0xFFF3E5F5)],
                          )
                        : null,
                    color: isCards ? null : Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(
                      color: isCards
                          ? AppColors.primary.withValues(alpha: 0.15)
                          : AppColors.border.withValues(alpha: 0.7),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: isCards ? 0.08 : 0.04),
                        blurRadius: isCards ? 14 : 8,
                        offset: Offset(0, isCards ? 4 : 2),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Expanded(
                        child: b.logoUrl.isNotEmpty
                            ? AppNetworkImage(url: b.logoUrl, fit: BoxFit.contain)
                            : Center(
                                child: Text(
                                  b.name,
                                  maxLines: 2,
                                  textAlign: TextAlign.center,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
                                ),
                              ),
                      ),
                      if (isCards)
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'خصومات',
                            style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
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
      ),
    );
  }
}
