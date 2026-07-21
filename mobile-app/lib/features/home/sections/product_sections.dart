import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/card_sizes.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../data/models/home_section.dart';
import '../../shell/main_shell.dart';
import '../home_link.dart';
import '../widgets/home_product_row.dart';
import '../widgets/home_section_shell.dart';
import '../widgets/home_theme.dart';

class ProductCarouselSection extends StatelessWidget {
  final HomeSection section;
  final bool compactTop;
  final bool nested;

  const ProductCarouselSection({
    super.key,
    required this.section,
    this.compactTop = false,
    this.nested = false,
  });

  @override
  Widget build(BuildContext context) {
    if (section.products.isEmpty) return const SizedBox.shrink();

    return HomeSectionShell(
      section: section,
      compactTop: compactTop,
      showTitle: nested ? false : null,
      actionLabel: !nested && section.showViewAll ? 'عرض الكل' : null,
      onAction: !nested && section.showViewAll
          ? () => openViewAllLink(
                context,
                query: section.viewAllQuery,
                fallbackQuery: 'isBestSeller=1',
              )
          : null,
      child: HomeProductRow(
        products: section.products,
        itemWidth: cardSizeSpec(section.productCardSize ?? section.cardSize)
            .productWidth
            .clamp(148, 164),
      ),
    );
  }
}

class FlashSaleHomeSection extends ConsumerStatefulWidget {
  final HomeSection section;
  final bool compactTop;

  const FlashSaleHomeSection({super.key, required this.section, this.compactTop = false});

  @override
  ConsumerState<FlashSaleHomeSection> createState() => _FlashSaleHomeSectionState();
}

class _FlashSaleHomeSectionState extends ConsumerState<FlashSaleHomeSection> {
  Timer? _timer;
  final _remaining = ValueNotifier<Duration>(Duration.zero);

  @override
  void initState() {
    super.initState();
    _tick();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _syncTimer(bool homeActive) {
    if (homeActive) {
      if (_timer == null || !(_timer?.isActive ?? false)) {
        _tick();
        _startTimer();
      }
    } else {
      _timer?.cancel();
      _timer = null;
    }
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
    ref.listen<int>(navIndexProvider, (_, next) => _syncTimer(next == 0));

    if (widget.section.products.isEmpty) return const SizedBox.shrink();

    Widget? countdown;
    if (widget.section.endsAt != null) {
      countdown = ValueListenableBuilder<Duration>(
        valueListenable: _remaining,
        builder: (_, remaining, __) {
          if (remaining <= Duration.zero) return const SizedBox.shrink();
          final h = remaining.inHours.toString().padLeft(2, '0');
          final m = (remaining.inMinutes % 60).toString().padLeft(2, '0');
          final s = (remaining.inSeconds % 60).toString().padLeft(2, '0');
          return HomeCountdownBoxes(hours: h, minutes: m, seconds: s);
        },
      );
    }

    return HomeSectionShell(
      section: widget.section,
      compactTop: widget.compactTop,
      overline: 'عروض محدودة',
      headerTrailing: countdown,
      actionLabel: widget.section.showViewAll ? 'عرض الكل' : null,
      onAction: widget.section.showViewAll
          ? () => openViewAllLink(
                context,
                query: widget.section.viewAllQuery,
                fallbackQuery: 'isPromo=1',
              )
          : null,
      child: HomeProductRow(
        products: widget.section.products,
        showPromoBadge: true,
        itemWidth: cardSizeSpec(
          widget.section.productCardSize ?? widget.section.cardSize,
        ).productWidth.clamp(140, 156),
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
      overline: 'مجموعات',
      actionLabel: section.showViewAll ? 'عرض الكل' : null,
      onAction: section.showViewAll
          ? () => openViewAllLink(
                context,
                query: section.viewAllQuery,
                fallbackQuery: 'isPromo=1&title=الباقات',
              )
          : null,
      child: SizedBox(
        height: 220,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(HomeTheme.paddingH, 0, HomeTheme.paddingH, 4),
          itemCount: section.packages.length,
          separatorBuilder: (_, __) => const SizedBox(width: 14),
          itemBuilder: (_, i) {
            final p = section.packages[i];
            final hasDiscount = p.originalPrice != null && p.originalPrice! > p.price;
            final cardW = cardSizeSpec(p.cardSize ?? section.cardSize).width.clamp(170, 210).toDouble();
            return GestureDetector(
              onTap: () => openPackageLink(context, p),
              child: Container(
                width: cardW,
                decoration: HomeTheme.cardDecoration(),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: p.coverUrl != null && p.coverUrl!.isNotEmpty
                          ? ProductCoverImage(
                              url: p.coverUrl!,
                              width: cardW,
                              fit: BoxFit.contain,
                            )
                          : ColoredBox(
                              color: HomeTheme.surfaceMuted,
                              child: const Center(
                                child: Icon(Icons.card_giftcard_rounded, color: AppColors.primary, size: 36),
                              ),
                            ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: HomeTheme.chipLabel),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Text(formatPrice(p.price), style: HomeTheme.price),
                              if (hasDiscount) ...[
                                const SizedBox(width: 6),
                                Text(
                                  formatPrice(p.originalPrice!),
                                  style: HomeTheme.body(size: 11).copyWith(decoration: TextDecoration.lineThrough),
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
            );
          },
        ),
      ),
    );
  }
}
