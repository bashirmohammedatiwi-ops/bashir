import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/home_section.dart';
import '../home_link.dart';

class ProductCarouselSection extends StatelessWidget {
  final HomeSection section;
  const ProductCarouselSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.products.isEmpty) return const SizedBox.shrink();
    final bg = parseHexColor(section.backgroundColor) ?? Colors.white;

    return ColoredBox(
      color: bg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (section.title != null && section.title!.isNotEmpty)
            SectionHeader(
              title: section.title!,
              actionLabel: section.showViewAll ? 'عرض الكل' : null,
              style: SectionHeaderStyle.niceOne,
              onAction: section.showViewAll && section.viewAllQuery != null
                  ? () => context.push('/products?${section.viewAllQuery}')
                  : null,
            ),
          SizedBox(
            height: 248,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              itemCount: section.products.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) => ProductCard(product: section.products[i], width: 150),
            ),
          ),
        ],
      ),
    );
  }
}

class FlashSaleHomeSection extends StatefulWidget {
  final HomeSection section;
  const FlashSaleHomeSection({super.key, required this.section});

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

    return ColoredBox(
      color: Colors.white,
      child: Column(
        children: [
          SectionHeader(
            title: widget.section.title ?? 'أقوى العروض',
            actionLabel: widget.section.showViewAll ? 'عرض الكل' : null,
            style: SectionHeaderStyle.niceOne,
            onAction: widget.section.showViewAll
                ? () => context.push('/products?${widget.section.viewAllQuery ?? 'isPromo=1'}')
                : null,
          ),
          SizedBox(
            height: 248,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              itemCount: widget.section.products.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) => ProductCard(
                product: widget.section.products[i],
                width: 150,
                showPromoBadge: true,
                flashTimer: hasTimer ? _timerLabel : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PackagesHomeSection extends StatelessWidget {
  final HomeSection section;
  const PackagesHomeSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.packages.isEmpty) return const SizedBox.shrink();
    return ColoredBox(
      color: Colors.white,
      child: Column(
        children: [
          if (section.title != null)
            SectionHeader(
              title: section.title!,
              actionLabel: 'عرض الكل',
              style: SectionHeaderStyle.niceOne,
              onAction: () {},
            ),
          SizedBox(
            height: 160,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              itemCount: section.packages.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) {
                final p = section.packages[i];
                return Container(
                  width: 200,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFEFEFEF)),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: p.coverUrl != null && p.coverUrl!.isNotEmpty
                            ? Image.network(p.coverUrl!, fit: BoxFit.cover, width: double.infinity)
                            : Container(color: AppColors.primaryLight),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8),
                        child: Text(p.name, maxLines: 1, style: const TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
