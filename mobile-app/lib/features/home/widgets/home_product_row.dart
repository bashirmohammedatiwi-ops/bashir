import 'package:flutter/material.dart';

import '../../../data/models/product.dart';
import 'home_product_card.dart';
import 'home_scroll_perf.dart';
import 'home_theme.dart';

class HomeProductRow extends StatelessWidget {
  final List<Product> products;
  final bool showPromoBadge;
  final double itemWidth;
  final EdgeInsetsGeometry? padding;

  const HomeProductRow({
    super.key,
    required this.products,
    this.showPromoBadge = false,
    this.itemWidth = HomeTheme.productCardWidth,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return HomeHorizontalList(
      height: HomeTheme.productRowHeight,
      padding: padding,
      itemCount: products.length,
      itemBuilder: (_, i) => HomeProductCard(
        key: ValueKey(products[i].id),
        product: products[i],
        width: itemWidth,
        showPromoBadge: showPromoBadge,
      ),
    );
  }
}
