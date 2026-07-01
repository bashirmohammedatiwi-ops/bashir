import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../core/widgets/app_network_image.dart';
import '../../../core/widgets/product_card.dart';
import '../../../data/models/home_section.dart';
import '../widgets/home_section_shell.dart';

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
      child: SizedBox(
        height: 262,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          itemCount: section.products.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) => ProductCard(product: section.products[i], width: 148, showRating: true),
        ),
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
  Duration _remaining = Duration.zero;

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
    setState(() => _remaining = diff.isNegative ? Duration.zero : diff);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _timerLabel {
    if (_remaining <= Duration.zero) return '';
    final h = _remaining.inHours.toString().padLeft(2, '0');
    final m = (_remaining.inMinutes % 60).toString().padLeft(2, '0');
    final s = (_remaining.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    if (widget.section.products.isEmpty) return const SizedBox.shrink();
    final hasTimer = widget.section.endsAt != null && _remaining > Duration.zero;

    return HomeSectionShell(
      section: widget.section,
      compactTop: widget.compactTop,
      actionLabel: widget.section.showViewAll ? 'عرض الكل' : null,
      onAction: widget.section.showViewAll
          ? () => context.push('/products?${widget.section.viewAllQuery ?? 'isPromo=1'}')
          : null,
      child: SizedBox(
        height: 262,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          itemCount: widget.section.products.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) => ProductCard(
            product: widget.section.products[i],
            width: 148,
            showPromoBadge: true,
            showRating: true,
            flashTimer: hasTimer ? _timerLabel : null,
          ),
        ),
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
        height: 188,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
          itemCount: section.packages.length,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, i) {
            final p = section.packages[i];
            final hasDiscount = p.originalPrice != null && p.originalPrice! > p.price;
            return GestureDetector(
              onTap: () => context.push('/package/${p.slug.isNotEmpty ? p.slug : p.id}'),
              child: Container(
                width: 210,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFEFEFEF)),
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
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
                          Text(p.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Text(formatPrice(p.price),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.primary,
                                      fontSize: 13)),
                              if (hasDiscount) ...[
                                const SizedBox(width: 6),
                                Text(formatPrice(p.originalPrice!),
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textMuted,
                                        decoration: TextDecoration.lineThrough)),
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
