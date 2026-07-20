import 'package:flutter/material.dart';

import '../../../data/models/product.dart';
import 'home_animations.dart';
import 'home_product_card.dart';
import 'home_theme.dart';

/// قائمة منتجات أفقية مع stagger animation.
class HomeProductRow extends StatelessWidget {
  final List<Product> products;
  final bool showPromoBadge;
  final double itemWidth;
  final EdgeInsetsGeometry? padding;

  const HomeProductRow({
    super.key,
    required this.products,
    this.showPromoBadge = false,
    this.itemWidth = 148,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 232,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: padding ??
            const EdgeInsets.fromLTRB(
              HomeTheme.paddingH,
              0,
              HomeTheme.paddingH,
              4,
            ),
        itemCount: products.length,
        separatorBuilder: (_, __) => const SizedBox(width: HomeTheme.itemGap),
        itemBuilder: (_, i) => HomeStaggerItem(
          index: i,
          child: HomeProductCard(
            key: ValueKey(products[i].id),
            product: products[i],
            width: itemWidth,
            showPromoBadge: showPromoBadge,
          ),
        ),
      ),
    );
  }
}
