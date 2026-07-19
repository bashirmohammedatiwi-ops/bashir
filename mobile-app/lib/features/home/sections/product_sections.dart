import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/horizontal_product_list.dart';
import '../../../data/models/home_section.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_animations.dart';

class ProductCarouselSection extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  const ProductCarouselSection({super.key, required this.section, this.compactTop = false});

  @override
  Widget build(BuildContext context) {
    if (section.products.isEmpty) return const SizedBox.shrink();

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: section.showViewAll ? 'عرض الكل' : null,
      onAction: section.showViewAll && section.viewAllQuery != null
          ? () => context.push('/products?${section.viewAllQuery}')
          : null,
      child: HorizontalProductList(
        products: section.products,
        showRating: true,
        itemWidth: cardSizeSpec(section.productCardSize ?? section.cardSize).productWidth,
      ),
    );
  }
}

class FlashSaleHomeSection extends StatefulWidget {
  final HomeSection section;
  final bool compactTop;
  const FlashSaleHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  State<FlashSaleHomeSection> createState() => _FlashSaleHomeSectionState();
}

class _FlashSaleHomeSectionState extends State<FlashSaleHomeSection> {
  Timer? _timer;
  final _remaining = ValueNotifier<Duration>(Duration.zero);

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final end = widget.section.endsAt;
    if (end == null) return;
    final diff = end.difference(DateTime.now());
    _remaining.value = diff.isNegative ? Duration.zero : diff;
  }

  @override
  void dispose() {
    _timer?.cancel();
    _remaining.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.section.products.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: HomeShimmerBorder(
        borderRadius: BorderRadius.circular(AppRadius.xl + 2),
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: AppColors.flashSaleGradient,
            borderRadius: BorderRadius.circular(AppRadius.xl + 1),
          ),
          child: HomeSectionShell(
          section: widget.section,
          compactTop: widget.compactTop,
          elevated: false,
          actionLabel: widget.section.showViewAll ? 'عرض الكل' : null,
          onAction: widget.section.showViewAll
              ? () => context.push('/products?${widget.section.viewAllQuery ?? 'isPromo=1'}')
              : null,
          headerTrailing: widget.section.endsAt != null
              ? ValueListenableBuilder<Duration>(
                  valueListenable: _remaining,
                  builder: (_, remaining, __) {
                    if (remaining <= Duration.zero) return const SizedBox.shrink();
                    final h = remaining.inHours.toString().padLeft(2, '0');
                    final m = (remaining.inMinutes % 60).toString().padLeft(2, '0');
                    final s = (remaining.inSeconds % 60).toString().padLeft(2, '0');
                    return PulseBadge(child: _FlashCountdownChip(label: '$h:$m:$s'));
                  },
                )
              : null,
          child: HorizontalProductList(
            products: widget.section.products,
            showRating: true,
            showPromoBadge: true,
            itemWidth: cardSizeSpec(
              widget.section.productCardSize ?? widget.section.cardSize,
            ).productWidth,
          ),
        ),
        ),
      ),
    );
  }
}

class _FlashCountdownChip extends StatelessWidget {
  final String label;
  const _FlashCountdownChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(AppRadius.pill),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.timer_outlined, size: 14, color: Colors.white),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              fontFeatures: [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}

class PackagesHomeSection extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  const PackagesHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  Widget build(BuildContext context) {
    if (section.packages.isEmpty) return const SizedBox.shrink();
    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      actionLabel: 'عرض الكل',
      onAction: () => context.push('/products?isPromo=1&title=الباقات'),
      child: SizedBox(
        height: cardSizeSpec(section.cardSize).height.clamp(168, 210).toDouble(),
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          cacheExtent: 280,
          itemCount: section.packages.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) {
            final p = section.packages[i];
            final hasDiscount = p.originalPrice != null && p.originalPrice! > p.price;
            final cardW = cardSizeSpec(p.cardSize ?? section.cardSize).width.clamp(180, 230).toDouble();
            return RepaintBoundary(
              child: GestureDetector(
                onTap: () {
                  if (p.link != null && p.link!.isNotEmpty) {
                    context.push(p.link!);
                  } else {
                    context.push('/package/${p.slug.isNotEmpty ? p.slug : p.id}');
                  }
                },
                child: Container(
                  width: cardW,
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
                        child: p.coverUrl != null && p.coverUrl!.isNotEmpty
                            ? AppNetworkImage(url: p.coverUrl!, width: 210, fit: BoxFit.cover)
                            : Container(
                                color: AppColors.primaryLight,
                                alignment: Alignment.center,
                                child: const Icon(Icons.card_giftcard_rounded,
                                    color: AppColors.primary, size: 40),
                              ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Text(
                                  formatPrice(p.price),
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.primary,
                                    fontSize: 13,
                                  ),
                                ),
                                if (hasDiscount) ...[
                                  const SizedBox(width: 6),
                                  Text(
                                    formatPrice(p.originalPrice!),
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.textMuted,
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
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
