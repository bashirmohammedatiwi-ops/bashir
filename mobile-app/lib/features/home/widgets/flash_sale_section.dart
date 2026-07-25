import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/product_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../data/models/home_feed.dart';
import 'home_scroll_perf.dart';

/// قسم «أقوى العروض» — legacy fallback (غير مستخدم في المسار الرئيسي).
class FlashSaleSection extends StatelessWidget {
  final FlashSale flashSale;
  final String title;
  const FlashSaleSection({super.key, required this.flashSale, this.title = 'أقوى العروض'});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SectionHeader(
            title: title,
            actionLabel: 'عرض الكل',
            style: SectionHeaderStyle.niceOne,
            onAction: () => context.push('/products?isPromo=1&title=${Uri.encodeComponent(title)}'),
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
