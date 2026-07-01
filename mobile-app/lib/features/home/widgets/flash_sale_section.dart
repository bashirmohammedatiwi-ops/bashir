import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/home_feed.dart';

/// قسم «أقوى العروض» — خلفية بيضاء وسلايدر أفقي مثل Nice One.
class FlashSaleSection extends StatefulWidget {
  final FlashSale flashSale;
  final String title;
  const FlashSaleSection({super.key, required this.flashSale, this.title = 'أقوى العروض'});

  @override
  State<FlashSaleSection> createState() => _FlashSaleSectionState();
}

class _FlashSaleSectionState extends State<FlashSaleSection> {
  Timer? _timer;
  Duration _remaining = Duration.zero;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final end = widget.flashSale.endsAt;
    if (end == null) {
      setState(() => _remaining = Duration.zero);
      return;
    }
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
    final hasTimer = widget.flashSale.endsAt != null && _remaining > Duration.zero;

    return ColoredBox(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: widget.title,
            actionLabel: 'عرض الكل',
            style: SectionHeaderStyle.niceOne,
            onAction: () => context.push('/products?isPromo=1&title=${Uri.encodeComponent(widget.title)}'),
          ),
          SizedBox(
            height: 248,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              itemCount: widget.flashSale.products.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) => ProductCard(
                product: widget.flashSale.products[i],
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
