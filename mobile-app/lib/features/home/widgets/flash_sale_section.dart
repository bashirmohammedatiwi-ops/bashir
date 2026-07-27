import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/l10n/app_strings.dart';
import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/home_feed.dart';
import 'home_scroll_perf.dart';

/// قسم «أقوى العروض» — legacy fallback (غير مستخدم في المسار الرئيسي).
class FlashSaleSection extends ConsumerWidget {
  final FlashSale flashSale;
  final String? title;

  const FlashSaleSection({super.key, required this.flashSale, this.title});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.s;
    final sectionTitle = title ?? s.topOffers;

    return ColoredBox(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: sectionTitle,
            actionLabel: s.viewAll,
            style: SectionHeaderStyle.niceOne,
            onAction: () => context.push('/products?isPromo=1&title=${Uri.encodeComponent(sectionTitle)}'),
          ),
          HomeHorizontalList(
            height: 248,
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
            itemCount: flashSale.products.length,
            itemBuilder: (_, i) => ProductCard(
              product: flashSale.products[i],
              width: 150,
              showPromoBadge: true,
              lite: true,
            ),
          ),
        ],
      ),
    );
  }
}
